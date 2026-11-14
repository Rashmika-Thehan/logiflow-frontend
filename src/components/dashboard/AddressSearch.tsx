import { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  MagnifyingGlass,
  CircleNotch,
  Check,
  Warning,
  SlidersHorizontal,
} from '@phosphor-icons/react';
import { searchAddress, type GeocodingResult, type GeocodingAccuracy } from '@/lib/geocoding';
import { Input } from '@/components/ui/input';

interface Props {
  addressValue: string;
  latValue?: number;
  lngValue?: number;
  onSelect: (result: { address: string; lat: number; lng: number; accuracy: GeocodingAccuracy }) => void;
  onAddressChange: (address: string) => void;
  onManualCoordChange: (lat: number, lng: number) => void;
  addressError?: string;
  latError?: string;
  lngError?: string;
  disabled?: boolean;
}

const accuracyBadge: Record<GeocodingAccuracy, { label: string; style: string }> = {
  exact: {
    label: 'Exact door',
    style: 'border-status-available/40 bg-status-available/10 text-status-available',
  },
  street: {
    label: 'Street level',
    style: 'border-status-break/40 bg-status-break/10 text-status-break',
  },
  area: {
    label: 'Area / City level',
    style: 'border-surface-5 bg-surface-4 text-fg-muted',
  },
};

export function AddressSearch({
  addressValue,
  latValue,
  lngValue,
  onSelect,
  onAddressChange,
  onManualCoordChange,
  addressError,
  latError,
  lngError,
  disabled = false,
}: Props) {
  const [query, setQuery] = useState(addressValue || '');
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [currentAccuracy, setCurrentAccuracy] = useState<GeocodingAccuracy | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal query state if parent changes address
  useEffect(() => {
    setQuery(addressValue || '');
  }, [addressValue]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!dropdownOpen || query.trim().length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchAddress(query, controller.signal);
        setResults(data);
        setSearched(true);
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          setResults([]);
          setSearched(true);
        }
      } finally {
        setLoading(false);
      }
    }, 450);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, dropdownOpen]);

  const handleSelect = (item: GeocodingResult) => {
    setQuery(item.displayName);
    setCurrentAccuracy(item.accuracy);
    setDropdownOpen(false);
    onSelect({
      address: item.displayName,
      lat: item.lat,
      lng: item.lng,
      accuracy: item.accuracy,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onAddressChange(val);
    setDropdownOpen(true);
    setSearched(false);
    // If user changes text manually, clear previous accuracy tag
    setCurrentAccuracy(null);
  };

  const hasCoordinates =
    typeof latValue === 'number' &&
    !isNaN(latValue) &&
    typeof lngValue === 'number' &&
    !isNaN(lngValue) &&
    latValue !== 0 &&
    lngValue !== 0;

  return (
    <div ref={containerRef} className="relative flex flex-col gap-2">
      <div className="relative">
        <Input
          id="recipientAddress"
          autoComplete="off"
          disabled={disabled}
          placeholder="Start typing street name, landmark, or city..."
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (query.trim().length >= 3) {
              setDropdownOpen(true);
            }
          }}
          className="pr-10"
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-fg-muted">
          {loading ? (
            <CircleNotch size={18} className="animate-spin text-fg" />
          ) : (
            <MagnifyingGlass size={18} />
          )}
        </div>
      </div>

      {addressError && (
        <p role="alert" className="caption-2 text-status-urgent">
          {addressError}
        </p>
      )}

      {/* Dropdown Suggestions */}
      {dropdownOpen && query.trim().length >= 3 && (
        <div className="absolute top-[42px] z-50 w-full overflow-hidden rounded-xl border border-surface-5 bg-surface-2 shadow-xl backdrop-blur-md">
          {loading && results.length === 0 && (
            <div className="flex items-center gap-2 p-3 text-fg-muted caption-1">
              <CircleNotch size={16} className="animate-spin" />
              Searching address records...
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="flex flex-col gap-1 p-3 text-fg-muted caption-1">
              <div className="flex items-center gap-1.5 text-status-break">
                <Warning size={16} />
                <span>No matching locations found.</span>
              </div>
              <p className="caption-2">
                Try including city or province, or switch to manual coordinates below.
              </p>
            </div>
          )}

          {results.length > 0 && (
            <ul className="max-h-60 overflow-y-auto divide-y divide-surface-4">
              {results.map((item) => {
                const badge = accuracyBadge[item.accuracy];
                return (
                  <li key={item.placeId}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="flex w-full items-start gap-2.5 p-3 text-left transition-colors duration-150 hover:bg-surface-3 focus:bg-surface-3 focus:outline-none"
                    >
                      <MapPin size={20} className="shrink-0 mt-0.5 text-fg-muted" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="body-6 font-medium text-fg truncate">
                            {item.title}
                          </span>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${badge.style}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        {item.subtitle && (
                          <p className="caption-2 text-fg-muted truncate mt-0.5">
                            {item.subtitle}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {/* Location Confirmation Pill / Coordinate Summary */}
      {hasCoordinates && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-surface-5 bg-surface-3/60 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-status-available/20 text-status-available">
              <Check size={12} weight="bold" />
            </span>
            <span className="font-mono text-fg font-medium">
              {latValue.toFixed(6)}, {lngValue.toFixed(6)}
            </span>
            {currentAccuracy && (
              <span
                className={`rounded-full border px-2 py-0.2 text-[10px] uppercase font-semibold ${accuracyBadge[currentAccuracy].style}`}
              >
                {accuracyBadge[currentAccuracy].label}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setManualMode(!manualMode)}
            className="flex items-center gap-1 caption-2 text-fg-muted hover:text-fg transition-colors"
          >
            <SlidersHorizontal size={14} />
            <span>{manualMode ? 'Hide coordinates' : 'Adjust coordinates'}</span>
          </button>
        </div>
      )}

      {/* Empty coordinates notice if not selected yet */}
      {!hasCoordinates && (
        <div className="flex items-center justify-between pt-0.5">
          <span className="caption-2 text-fg-muted">
            Select an address above to automatically pinpoint GPS coordinates.
          </span>
          <button
            type="button"
            onClick={() => setManualMode(!manualMode)}
            className="flex items-center gap-1 caption-2 text-fg-muted hover:text-fg transition-colors underline"
          >
            <span>{manualMode ? 'Hide manual inputs' : 'Enter coordinates manually'}</span>
          </button>
        </div>
      )}

      {/* Manual Coordinates Override */}
      {manualMode && (
        <div className="grid gap-3 sm:grid-cols-2 pt-1 border-t border-surface-5 mt-1">
          <div>
            <label htmlFor="manualLat" className="caption-1 text-fg-muted block mb-1">
              Latitude (-90 to 90)
            </label>
            <Input
              id="manualLat"
              type="number"
              step="any"
              placeholder="e.g. 6.9271"
              value={latValue ?? ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onManualCoordChange(isNaN(val) ? 0 : val, lngValue ?? 0);
              }}
            />
            {latError && (
              <p role="alert" className="caption-2 text-status-urgent mt-1">
                {latError}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="manualLng" className="caption-1 text-fg-muted block mb-1">
              Longitude (-180 to 180)
            </label>
            <Input
              id="manualLng"
              type="number"
              step="any"
              placeholder="e.g. 79.8612"
              value={lngValue ?? ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onManualCoordChange(latValue ?? 0, isNaN(val) ? 0 : val);
              }}
            />
            {lngError && (
              <p role="alert" className="caption-2 text-status-urgent mt-1">
                {lngError}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
