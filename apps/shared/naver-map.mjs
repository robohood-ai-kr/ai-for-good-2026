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

const mapCatalog = {
  'small-business': {
    page: 4,
    defaultId: 'restaurant',
    zoom: 14,
    badge: '네이버 지도 · 생활권 보기',
    canvasLabel: '네이버 지도에 표시한 서울 생활권 수집 현장 예시',
    regionLabel: '서울 생활권의 두 수집 현장 예시를 표시한 네이버 지도. 실제 사업장 위치가 아닙니다.',
    sites: {
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
    },
  },
  manufacturing: {
    page: 21,
    defaultId: 'hanbit',
    center: { latitude: 36.35, longitude: 127.8 },
    zoom: 7,
    badge: '네이버 지도 · 제조 권역 보기',
    canvasLabel: '네이버 지도에 표시한 제조 권역의 모의 수집 현장 예시',
    regionLabel: '제조 권역의 세 모의 현장 위치 예시를 표시한 네이버 지도. 실제 사업장 위치가 아닙니다.',
    sites: {
      hanbit: {
        title: '한빛 정밀 모의 현장',
        latitude: 37.4852,
        longitude: 126.9015,
        href: './mf-06.html',
      },
      metalB: {
        title: '모의 금속가공 현장 B',
        latitude: 36.3504,
        longitude: 127.3845,
      },
      assemblyC: {
        title: '모의 조립 현장 C',
        latitude: 35.1796,
        longitude: 129.0756,
      },
    },
  },
};

export async function initNaverMap(config) {
  const catalog = mapCatalog[config.sector];
  const mapElement = document.querySelector('.rh-kind-explorer .rh-map');
  if (!catalog || !mapElement || config.number !== catalog.page) return;

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
    const requested = new URL(location.href).searchParams.get(config.sector === 'small-business' ? 'scenario' : 'site');
    const activeId = Object.hasOwn(catalog.sites, requested) ? requested : catalog.defaultId;
    const active = catalog.sites[activeId];
    const center = catalog.center ?? active;
    const canvas = document.createElement('div');
    canvas.className = 'rh-naver-map';
    canvas.setAttribute('aria-label', catalog.canvasLabel);
    const badge = document.createElement('span');
    badge.className = 'rh-map-api-badge';
    badge.textContent = catalog.badge;
    mapElement.replaceChildren(canvas, badge);

    const map = new maps.Map(canvas, {
      center: new maps.LatLng(center.latitude, center.longitude),
      zoom: catalog.zoom,
      zoomControl: true,
      zoomControlOptions: { position: maps.Position.TOP_RIGHT },
    });

    for (const [id, site] of Object.entries(catalog.sites)) {
      const marker = new maps.Marker({
        map,
        position: new maps.LatLng(site.latitude, site.longitude),
        title: `${site.title} · 위치 예시`,
      });
      if (config.sector === 'small-business') {
        maps.Event.addListener(marker, 'click', () => {
          const params = new URLSearchParams(location.search);
          params.set('scenario', id);
          location.href = `./sb-05.html?${params.toString()}`;
        });
      } else if (site.href) {
        maps.Event.addListener(marker, 'click', () => {
          location.href = site.href;
        });
      }
    }

    mapElement.dataset.mapProvider = 'naver';
    mapElement.dataset.mapSector = config.sector;
    mapElement.setAttribute('role', 'region');
    mapElement.setAttribute('aria-label', catalog.regionLabel);
  } catch (error) {
    mapElement.innerHTML = fallback;
    mapElement.dataset.mapProvider = 'fallback';
    console.warn('[RoboHood map fallback]', error.message);
  } finally {
    mapElement.removeAttribute('aria-busy');
  }
}
