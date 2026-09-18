// Deterministic UI copy editing. No generative image model is used.
// macOS: swift scripts/ui_text_overlays.swift inventory <gallery-dir>
// macOS: swift scripts/ui_text_overlays.swift render <manifest.json>
import AppKit
import Vision
import CryptoKit

struct TextBox: Codable {
    let text: String
    let confidence: Float
    let x: Double
    let y: Double
    let width: Double
    let height: Double
}
struct Inventory: Codable {
    let file: String
    let width: Int
    let height: Int
    let boxes: [TextBox]
}
struct Patch: Codable {
    let sourceText: String
    let text: String
    let x: Int
    let y: Int
    let width: Int
    let height: Int
    let fontSize: Double
    let weight: String
    let color: String
    let background: String
    let backgroundEnd: String?
    let align: String?
}
struct Edit: Codable {
    let source: String
    let output: String
    let patches: [Patch]
}
struct Manifest: Codable {
    let version: String
    let method: String
    let edits: [Edit]
}
struct Report: Codable {
    let source: String
    let output: String
    let sourceSHA256: String
    let outputSHA256: String
    let width: Int
    let height: Int
    let patchCount: Int
    let changedPixels: Int
    let changedOutsidePatches: Int
}

func loadImage(_ file: String) throws -> CGImage {
    let url = URL(fileURLWithPath: file)
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        throw NSError(domain: "UIOverlay", code: 1, userInfo: [NSLocalizedDescriptionKey: "Cannot decode \(file)"])
    }
    return image
}
func hexColor(_ hex: String) -> NSColor {
    let number = UInt32(hex.replacingOccurrences(of: "#", with: ""), radix: 16)!
    return NSColor(srgbRed: CGFloat((number >> 16) & 255) / 255,
                   green: CGFloat((number >> 8) & 255) / 255,
                   blue: CGFloat(number & 255) / 255, alpha: 1)
}
func encode<T: Encodable>(_ value: T) throws -> Data {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
    return try encoder.encode(value)
}
func hash(_ data: Data) -> String {
    SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
}
func context(_ width: Int, _ height: Int) -> CGContext {
    CGContext(data: nil, width: width, height: height, bitsPerComponent: 8,
              bytesPerRow: width * 4, space: CGColorSpace(name: CGColorSpace.sRGB)!,
              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
}

let args = CommandLine.arguments
guard args.count == 3 else { fatalError("Use inventory <gallery-dir> or render <manifest.json>") }
if args[1] == "inventory" {
    let dir = URL(fileURLWithPath: args[2])
    let allFiles = try FileManager.default.contentsOfDirectory(atPath: dir.path)
    let files = allFiles.filter { $0.hasSuffix(".png") && !allFiles.contains($0.replacingOccurrences(of: ".png", with: "-aligned.png")) }.sorted()
    var result: [Inventory] = []
    for file in files {
        let image = try loadImage(dir.appendingPathComponent(file).path)
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = .accurate
        request.recognitionLanguages = ["ko-KR", "en-US"]
        request.usesLanguageCorrection = false
        try VNImageRequestHandler(cgImage: image).perform([request])
        let boxes = (request.results ?? []).compactMap { observation -> TextBox? in
            guard let text = observation.topCandidates(1).first else { return nil }
            let box = observation.boundingBox
            return TextBox(text: text.string, confidence: text.confidence,
                x: box.minX * Double(image.width), y: (1 - box.maxY) * Double(image.height),
                width: box.width * Double(image.width), height: box.height * Double(image.height))
        }
        result.append(Inventory(file: file, width: image.width, height: image.height, boxes: boxes))
    }
    let isAfter = dir.lastPathComponent == "text-overlays"
    let auditDir = isAfter ? dir : dir.appendingPathComponent("text-overlays")
    try FileManager.default.createDirectory(at: auditDir, withIntermediateDirectories: true)
    try encode(result).write(to: auditDir.appendingPathComponent(isAfter ? "ocr-inventory-after.json" : "ocr-inventory.json"))
    let relevant = result.map { item in
        Inventory(file: item.file, width: item.width, height: item.height,
            boxes: item.boxes.filter { $0.text.contains("오퍼") || $0.text.contains("청년") || $0.text.lowercased().contains("operator") })
    }
    FileHandle.standardOutput.write(try encode(relevant))
} else if args[1] == "render" {
    let manifestURL = URL(fileURLWithPath: args[2]).standardizedFileURL
    let base = manifestURL.deletingLastPathComponent()
    let manifest = try JSONDecoder().decode(Manifest.self, from: Data(contentsOf: manifestURL))
    var reports: [Report] = []
    for edit in manifest.edits {
        let sourceURL = base.appendingPathComponent(edit.source).standardizedFileURL
        let outputURL = base.appendingPathComponent(edit.output).standardizedFileURL
        precondition(sourceURL != outputURL, "Never overwrite a source image")
        let sourceData = try Data(contentsOf: sourceURL)
        let image = try loadImage(sourceURL.path)
        let w = image.width, h = image.height
        let original = context(w, h)
        original.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
        let canvas = context(w, h)
        canvas.draw(image, in: CGRect(x: 0, y: 0, width: w, height: h))
        NSGraphicsContext.saveGraphicsState()
        NSGraphicsContext.current = NSGraphicsContext(cgContext: canvas, flipped: false)
        for patch in edit.patches {
            precondition(patch.x >= 0 && patch.y >= 0 && patch.x + patch.width <= w && patch.y + patch.height <= h, "Patch outside image")
            let rect = CGRect(x: patch.x, y: h - patch.y - patch.height, width: patch.width, height: patch.height)
            canvas.saveGState()
            canvas.clip(to: rect)
            if patch.background == "sample" {
                // Bilinear interpolation from clear corners preserves a flat/soft
                // card background without changing anything beyond this text box.
                let pixels = original.data!.assumingMemoryBound(to: UInt8.self)
                let painted = canvas.data!.assumingMemoryBound(to: UInt8.self)
                let left = max(0, patch.x - 2), right = min(w - 1, patch.x + patch.width + 1)
                let top = max(0, patch.y - 2), bottom = min(h - 1, patch.y + patch.height + 1)
                for py in patch.y..<(patch.y + patch.height) {
                    let ty = Double(py - patch.y) / Double(max(1, patch.height - 1))
                    for px in patch.x..<(patch.x + patch.width) {
                        let tx = Double(px - patch.x) / Double(max(1, patch.width - 1))
                        for c in 0..<4 {
                            let a = Double(pixels[(top * w + left) * 4 + c])
                            let b = Double(pixels[(top * w + right) * 4 + c])
                            let d = Double(pixels[(bottom * w + left) * 4 + c])
                            let e = Double(pixels[(bottom * w + right) * 4 + c])
                            painted[(py * w + px) * 4 + c] = UInt8(((a * (1 - tx) + b * tx) * (1 - ty) + (d * (1 - tx) + e * tx) * ty).rounded())
                        }
                    }
                }
            } else if let end = patch.backgroundEnd {
                let colors = [hexColor(patch.background).cgColor, hexColor(end).cgColor] as CFArray
                let gradient = CGGradient(colorsSpace: CGColorSpace(name: CGColorSpace.sRGB), colors: colors, locations: [0, 1])!
                canvas.drawLinearGradient(gradient, start: CGPoint(x: rect.midX, y: rect.minY), end: CGPoint(x: rect.midX, y: rect.maxY), options: [.drawsBeforeStartLocation, .drawsAfterEndLocation])
            } else {
                canvas.setFillColor(hexColor(patch.background).cgColor)
                canvas.fill(rect)
            }
            let fontWeight: NSFont.Weight = patch.weight == "bold" ? .bold : patch.weight == "medium" ? .medium : .regular
            let paragraph = NSMutableParagraphStyle()
            paragraph.alignment = patch.align == "center" ? .center : .left
            paragraph.lineBreakMode = .byClipping
            let attributes: [NSAttributedString.Key: Any] = [
                .font: NSFont.systemFont(ofSize: patch.fontSize, weight: fontWeight),
                .foregroundColor: hexColor(patch.color), .paragraphStyle: paragraph
            ]
            let text = NSAttributedString(string: patch.text, attributes: attributes)
            let bounds = text.boundingRect(with: CGSize(width: 10000, height: 10000), options: [.usesLineFragmentOrigin, .usesFontLeading])
            precondition(bounds.width <= rect.width + 1 && bounds.height <= rect.height + 1, "Text overflows: \(patch.text), \(bounds), \(rect)")
            let line = CGRect(x: rect.minX, y: rect.midY - bounds.height / 2, width: rect.width, height: bounds.height)
            text.draw(in: line)
            canvas.restoreGState()
        }
        NSGraphicsContext.restoreGraphicsState()
        let before = original.data!.assumingMemoryBound(to: UInt8.self)
        let after = canvas.data!.assumingMemoryBound(to: UInt8.self)
        var changed = 0, outside = 0
        for y in 0..<h {
            for x in 0..<w {
                let i = (y * w + x) * 4
                if (0..<4).contains(where: { before[i + $0] != after[i + $0] }) {
                    changed += 1
                    let covered = edit.patches.contains { x >= $0.x && x < $0.x + $0.width && y >= $0.y && y < $0.y + $0.height }
                    if !covered { outside += 1 }
                }
            }
        }
        precondition(outside == 0, "Changed \(outside) pixels outside allowed text rectangles")
        let output = canvas.makeImage()!
        let bitmap = NSBitmapImageRep(cgImage: output)
        let png = bitmap.representation(using: .png, properties: [:])!
        try FileManager.default.createDirectory(at: outputURL.deletingLastPathComponent(), withIntermediateDirectories: true)
        try png.write(to: outputURL)
        let sourceAfter = try Data(contentsOf: sourceURL)
        precondition(hash(sourceAfter) == hash(sourceData), "Source changed")
        // Check the actual saved PNG, not only the in-memory drawing buffer.
        let decoded = try loadImage(outputURL.path)
        precondition(decoded.width == w && decoded.height == h, "Output dimensions changed")
        let savedContext = context(w, h)
        savedContext.draw(decoded, in: CGRect(x: 0, y: 0, width: w, height: h))
        let saved = savedContext.data!.assumingMemoryBound(to: UInt8.self)
        for byte in 0..<(w * h * 4) {
            precondition(saved[byte] == after[byte], "Saved PNG differs from verified sRGB pixels")
        }
        reports.append(Report(source: edit.source, output: edit.output, sourceSHA256: hash(sourceData), outputSHA256: hash(png), width: w, height: h, patchCount: edit.patches.count, changedPixels: changed, changedOutsidePatches: outside))
    }
    let reportURL = base.appendingPathComponent("text-overlay-report.json")
    try encode(reports).write(to: reportURL)
    FileHandle.standardOutput.write(try encode(reports))
} else {
    fatalError("Unknown command \(args[1])")
}
