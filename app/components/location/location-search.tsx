'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Loader2, MapPin, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { LocationSearchResult } from '@/lib/location/types';
import { useLanguage } from '@/lib/i18n/context';

interface LocationSearchProps {
  onSelect: (result: LocationSearchResult) => void;
}

/**
 * Compact location search for the project form (Nominatim via /api/location/search).
 * Does not redesign the form — sits beside existing location fields.
 */
export function LocationSearch({ onSelect }: LocationSearchProps) {
  const { t } = useLanguage();
  const inputId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    async (q: string) => {
      abortRef.current?.abort();
      if (q.trim().length < 2) {
        setResults([]);
        setOpen(false);
        return;
      }
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/location/search?q=${encodeURIComponent(q.trim())}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('search failed');
        const data = (await res.json()) as { results?: LocationSearchResult[] };
        setResults(data.results ?? []);
        setOpen(true);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setError(t('loc.searchFailed'));
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const handleSelect = (item: LocationSearchResult) => {
    onSelect(item);
    setQuery(item.label.slice(0, 80));
    setOpen(false);
  };

  return (
    <div className="relative space-y-1.5">
      <label htmlFor={inputId} className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
        <Search className="h-3.5 w-3.5" aria-hidden />
        {t('form.locationSearch')}
      </label>
      <div className="relative">
        <Input
          id={inputId}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={t('loc.placeholder')}
          className="pr-16"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open && results.length > 0}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />}
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              aria-label={t('loc.clear')}
              onClick={() => {
                setQuery('');
                setResults([]);
                setOpen(false);
              }}
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </Button>
          )}
        </div>
      </div>
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
      {open && results.length > 0 && (
        <ul
          className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover shadow-md"
          role="listbox"
        >
          {results.map((item) => (
            <li key={item.id} role="option">
              <button
                type="button"
                className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                onClick={() => handleSelect(item)}
              >
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.label}</span>
                  <span className="block text-xs text-muted-foreground">
                    {[item.city, item.state, item.country].filter(Boolean).join(' · ')}
                    {item.latitude != null && item.longitude != null
                      ? ` · ${item.latitude.toFixed(4)}, ${item.longitude.toFixed(4)}`
                      : ''}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="text-[11px] text-muted-foreground">{t('loc.hint')}</p>
    </div>
  );
}
