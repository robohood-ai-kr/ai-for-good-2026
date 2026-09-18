// Reuse only photographic/illustration regions of the immutable design PNGs.
// No screenshot of a button, label, table, or whole page is used as working UI.
// Coordinates are in the original PNG's pixel space, not CSS viewport pixels.
const crops = {
  'mf-01': [[260,240,365,332]], 'mf-03': [[21,660,198,195]],
  'mf-05': [[1158,383,331,151]], 'mf-06': [[628,210,506,242]],
  'mf-07': [[880,115,147,90]], 'mf-08': [[62,496,393,261]],
  'mf-09': [[671,272,389,390]], 'mf-10': [[305,311,257,252]],
  'mf-11': [[257,212,164,158],[915,696,183,106],[1105,697,187,104],[1303,697,184,104],[915,809,184,102],[1105,809,187,103],[1305,809,183,103]],
  'mf-12': [[280,586,202,159],[498,586,203,158],[717,586,201,159]],
  'mf-13': [[346,460,263,236]], 'mf-14': [[710,356,147,144]],
  'mf-16': [[262,264,208,156],[1006,688,116,95],[1133,688,114,95],[1256,688,115,95],[1380,688,113,95]],
  'mf-17': [[629,375,247,181]], 'mf-18': [[515,493,342,185]],
  'mf-19': [[273,229,180,179]], 'mf-21': [[880,384,99,92]],
  'sb-01': [[847,92,663,411]],
  'sb-02': [[604,701,257,179],[905,701,255,179],[1206,701,261,179]],
  'sb-03': [[555,520,535,285]],
  'sb-04': [[800,341,257,205],[790,659,184,109],[791,807,182,109]], 'sb-05': [[269,244,664,322]],
  'sb-06': [[309,730,337,161],[725,730,341,161],[1140,730,337,161]],
  'sb-07': [[712,793,161,102],[889,793,163,102]],
  // SB-08 embeds a play icon in its picture. Use the adjacent scene's clean art
  // rather than exposing a screenshot-only control that cannot play anything.
  'sb-08': [[269,244,664,322]],
  'sb-09': [[859,189,270,187],[271,892,181,77],[470,892,180,77],[666,892,176,77]],
  'sb-10': [[53,606,266,159],[53,816,266,162],[53,1030,266,164]],
  'sb-11': [[61,546,819,286]], 'sb-12': [[514,302,368,216]],
  'sb-13': [[61,447,819,323]], 'sb-14': [[74,537,388,352]],
  'sb-15': [[568,307,530,284],[568,787,124,96],[705,787,123,96],[837,787,123,96],[969,787,127,96]],
  'sb-16': [[330,350,349,210]],
  'sb-17': [[269,200,480,226],[270,485,86,91],[368,485,87,91],[466,485,87,91]],
  'sb-18': [[281,711,170,147],[497,711,169,147],[713,711,172,147],[931,711,162,147]],
  'sb-19': [[281,216,337,297]],
  'sb-20': [[710,650,247,188],[977,650,244,188],[1235,650,251,188]],
};
const illustrations = {
  'mf-02': [[267,237,195,137],[522,237,203,137],[776,237,200,137],[1031,237,200,137],[1282,237,201,137]],
  'sb-02': [[333,351,123,102],[588,351,132,107],[835,351,130,109],[1080,346,136,118],[1315,346,144,114]],
  'mf-03': [[316,566,60,60],[591,566,60,60],[873,566,59,59]],
  'sb-03': [[260,884,127,101],[690,884,110,101],[1138,884,100,101]],
  'mf-07': [[296,365,87,99],[295,510,88,94],[295,770,88,93]],
  'sb-09': [[282,510,86,81],[282,665,86,81]],
};

export function referenceArt(sector, number, index=0, type='photo') {
  const id = `${sector==='manufacturing'?'mf':'sb'}-${String(number).padStart(2,'0')}`;
  const [x,y,w,h] = (type==='illustration'?illustrations:crops)[id]?.[index] ?? [];
  if (x === undefined) return '';
  const mobile = id.startsWith('mf') ? [8,17,18].includes(number) : [10,11,12,13,14].includes(number);
  const width = mobile?941:1536, height = mobile?(id==='sb-14'?1671:1672):1024;
  const source = id==='sb-08' && type==='photo' ? 'sb-05' : id;
  return `<svg class="rh-scene" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${type==='illustration'?'역할 안내 일러스트':'업무 현장 예시 이미지'}"><image href="./references/${source}.png" x="0" y="0" width="${width}" height="${height}"/></svg>`;
}

export function scenePhoto(sector,number,cls='',index=0) {
  const art = referenceArt(sector,number,index);
  return art ? `<figure class="rh-photo ${cls}">${art}<figcaption>${sector==='manufacturing'?'RGB 수집 이미지':'현장 작업 이미지'}</figcaption></figure>` : '';
}

export const referenceCrops = crops;
export const referenceIllustrations = illustrations;
