import { createContext, ReactNode, useContext, useEffect } from 'react';
import {
  APIProvider,
  APILoadingStatus,
  useApiLoadingStatus,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';

const MapsReadyContext = createContext<{ hasKey: boolean }>({ hasKey: false });

export function useMapsKeyAvailable(): boolean {
  return useContext(MapsReadyContext).hasKey;
}

export function GoogleMapsAppProvider({ children }: { children: ReactNode }) {
  const apiKey = (import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '').trim();

  if (!apiKey) {
    return (
      <MapsReadyContext.Provider value={{ hasKey: false }}>
        {children}
      </MapsReadyContext.Provider>
    );
  }

  return (
    <MapsReadyContext.Provider value={{ hasKey: true }}>
      <APIProvider
        apiKey={apiKey}
        libraries={['marker', 'geometry']}
        language="en"
        region="US"
      >
        {children}
      </APIProvider>
    </MapsReadyContext.Provider>
  );
}

function LoadedStatusGuard({
  dark,
  heightClass,
  children,
}: {
  dark: boolean;
  heightClass: string;
  children: ReactNode;
}) {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div
        className={`w-full ${heightClass} flex flex-col items-center justify-center p-6 text-center rounded-2xl border ${
          dark
            ? 'bg-[#08151D] border-white/10 text-[#D0D7D2]'
            : 'bg-[#0E1814] border-[#E2DDD2] text-[#D0D7D2]'
        }`}
      >
        <p className="font-display text-xl font-semibold text-white">Unable to Load Google Maps</p>
        <p className="mt-2 text-xs text-[#9CA9A1] max-w-md leading-relaxed">
          Google Maps JavaScript API returned status <code className="font-mono text-[#C88A36]">{status}</code>. Check your API key restrictions or quota and reload.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export function GoogleMapsViewportGuard({
  dark = true,
  heightClass = 'h-[500px]',
  children,
}: {
  dark?: boolean;
  heightClass?: string;
  children: ReactNode;
}) {
  const hasKey = useMapsKeyAvailable();

  if (!hasKey) {
    return (
      <div
        className={`w-full ${heightClass} flex flex-col items-center justify-center p-6 text-center rounded-2xl border ${
          dark
            ? 'bg-[#08151D] border-white/10 text-[#D0D7D2]'
            : 'bg-[#0E1814] border-[#E2DDD2] text-[#D0D7D2]'
        }`}
      >
        <p className="font-display text-xl font-semibold text-white">Google Maps Key Required</p>
        <p className="mt-2 text-xs text-[#9CA9A1] max-w-md leading-relaxed">
          Configure <code className="font-mono text-[#C88A36]">VITE_GOOGLE_MAPS_API_KEY</code> in your environment to enable interactive Terrain, Satellite, and Hybrid Google Maps layers.
        </p>
      </div>
    );
  }

  return (
    <LoadedStatusGuard dark={dark} heightClass={heightClass}>
      {children}
    </LoadedStatusGuard>
  );
}

export interface LatLngPoint {
  lat: number;
  lng: number;
}

/**
 * Renders a true great-circle geodesic polyline on a Google Map instance.
 */
export function GeodesicRouteLine({
  origin,
  destination,
}: {
  origin: LatLngPoint;
  destination: LatLngPoint;
}) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');
  const coreLib = useMapsLibrary('core');

  useEffect(() => {
    if (!map || !mapsLib || !coreLib) return;

    const line = new mapsLib.Polyline({
      path: [origin, destination],
      geodesic: true,
      strokeColor: '#C88A36',
      strokeOpacity: 0.92,
      strokeWeight: 2.5,
      icons: [
        {
          icon: {
            path: coreLib.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 3,
            strokeColor: '#F6F4EF',
            fillColor: '#C88A36',
            fillOpacity: 1,
          },
          offset: '52%',
        },
      ],
      map,
    });

    return () => {
      line.setMap(null);
    };
  }, [map, mapsLib, coreLib, origin.lat, origin.lng, destination.lat, destination.lng]);

  return null;
}

/**
 * Renders a geographic conservation/exploration radius circle in meters.
 */
export function SectorRadiusCircle({
  center,
  radiusMeters = 8000,
}: {
  center: LatLngPoint;
  radiusMeters?: number;
}) {
  const map = useMap();
  const mapsLib = useMapsLibrary('maps');

  useEffect(() => {
    if (!map || !mapsLib) return;

    const circle = new mapsLib.Circle({
      center,
      radius: radiusMeters,
      strokeColor: '#C88A36',
      strokeOpacity: 0.75,
      strokeWeight: 1.5,
      fillColor: '#1B4332',
      fillOpacity: 0.16,
      map,
    });

    return () => {
      circle.setMap(null);
    };
  }, [map, mapsLib, center.lat, center.lng, radiusMeters]);

  return null;
}
