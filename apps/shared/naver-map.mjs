let sdkPromise;

function loadNaverMaps(clientId) {
  if (globalThis.naver?.maps) return Promise.resolve();
  if (sdkPromise) return sdkPromise;
  sdkPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.dataset.rhNaverMap = 'true';
    script.async = true;
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(clientId)}`;
    script.addEventListener('load', () => {
      if (!globalThis.naver?.maps) {
        reject(new Error('네이버 지도 SDK를 초기화하지 못했습니다.'));
        return;
      }
      resolve();
    }, { once: true });
    script.addEventListener('error', () => reject(new Error('네이버 지도 SDK를 불러오지 못했습니다.')), { once: true });
    document.head.append(script);
  });
  return sdkPromise;
}

const exampleSites = {
  restaurant: {
    title: '성수 식당 A',
    latitude: 37.5665,
    longitude: 126.9780,
  },
  mart: {
    title: '망원 동네마트 A',
    latitude: 37.5702,
    longitude: 126.9849,
  },
};

export async function initNaverMap(config) {
  const mapElement = document.querySelector('.rh-sector-sb.rh-kind-explorer .rh-map');
  if (!mapElement || config.sector !== 'small-business' || config.number !== 4) return;

  const clientId = String(config.naverMapClientId ?? '').trim();
  if (!clientId) {
    mapElement.dataset.mapProvider = 'fallback';
    return;
  }

  const fallback = mapElement.innerHTML;
  mapElement.setAttribute('aria-busy', 'true');
  try {
    await loadNaverMaps(clientId);
    const maps = globalThis.naver.maps;
    const requested = new URL(location.href).searchParams.get('scenario');
    const activeId = Object.hasOwn(exampleSites, requested) ? requested : 'restaurant';
    const active = exampleSites[activeId];
    const canvas = document.createElement('div');
    canvas.className = 'rh-naver-map';
    canvas.setAttribute('aria-label', '네이버 지도에 표시한 서울 생활권 수집 현장 예시');
    const badge = document.createElement('span');
    badge.className = 'rh-map-api-badge';
    badge.textContent = '네이버 지도 · 생활권 보기';
    mapElement.replaceChildren(canvas, badge);

    const map = new maps.Map(canvas, {
      center: new maps.LatLng(active.latitude, active.longitude),
      zoom: 14,
      zoomControl: true,
      zoomControlOptions: { position: maps.Position.TOP_RIGHT },
    });

    for (const [id, site] of Object.entries(exampleSites)) {
      const marker = new maps.Marker({
        map,
        position: new maps.LatLng(site.latitude, site.longitude),
        title: `${site.title} · 위치 예시`,
      });
      maps.Event.addListener(marker, 'click', () => {
        const params = new URLSearchParams(location.search);
        params.set('scenario', id);
        location.href = `./sb-05.html?${params.toString()}`;
      });
    }

    mapElement.dataset.mapProvider = 'naver';
    mapElement.setAttribute('role', 'region');
    mapElement.setAttribute('aria-label', '서울 생활권의 두 수집 현장 예시를 표시한 네이버 지도. 실제 사업장 위치가 아닙니다.');
  } catch (error) {
    mapElement.innerHTML = fallback;
    mapElement.dataset.mapProvider = 'fallback';
    console.warn('[RoboHood map fallback]', error.message);
  } finally {
    mapElement.removeAttribute('aria-busy');
  }
}
