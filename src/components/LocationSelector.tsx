import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Search, 
  ChevronDown, 
  Check, 
  Globe, 
  Layers, 
  X,
  Sparkles,
  Building
} from 'lucide-react';
import { 
  WORLD_COUNTRIES, 
  LocationItem, 
  searchLocations, 
  getStatesForCountry, 
  getCitiesForState 
} from '../data/worldLocations';

interface LocationSelectorProps {
  country?: string;
  city?: string;
  region?: string;
  onChange: (loc: { country: string; city: string; region?: string }) => void;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  country = '',
  city = '',
  region = '',
  onChange,
  label = 'Current City & Country',
  placeholder = 'Type city name e.g. Gazipur, Dhaka, New York, Tokyo...',
  className = '',
}) => {
  // Facebook search state
  const initialSearchText = city && country ? `${city}${region ? `, ${region}` : ''}, ${country}` : city || country || '';
  const [searchInput, setSearchInput] = useState(initialSearchText);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<LocationItem[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cascading state
  const [selectedCountry, setSelectedCountry] = useState(country || 'Bangladesh');
  const [selectedState, setSelectedState] = useState(region || 'Dhaka Division');
  const [selectedCity, setSelectedCity] = useState(city || 'Gazipur');
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [customCityInput, setCustomCityInput] = useState(city);
  const [showCascading, setShowCascading] = useState(false);

  // Sync external props with internal state
  useEffect(() => {
    if (country) setSelectedCountry(country);
    if (region) setSelectedState(region);
    if (city) {
      setSelectedCity(city);
      setCustomCityInput(city);
    }
    const combined = city && country ? `${city}${region ? `, ${region}` : ''}, ${country}` : city || country || '';
    if (combined) {
      setSearchInput(combined);
    }
  }, [country, city, region]);

  // Update cascading states when country changes
  useEffect(() => {
    if (selectedCountry) {
      const states = getStatesForCountry(selectedCountry);
      setAvailableStates(states);
      if (states.length > 0 && !states.includes(selectedState || '')) {
        setSelectedState(states[0]);
      }
    } else {
      setAvailableStates([]);
    }
  }, [selectedCountry]);

  // Update cascading cities when state changes
  useEffect(() => {
    if (selectedCountry && selectedState) {
      const cities = getCitiesForState(selectedCountry, selectedState);
      setAvailableCities(cities);
    } else {
      setAvailableCities([]);
    }
  }, [selectedCountry, selectedState]);

  // Handle Search Input Change
  const handleSearchChange = (val: string) => {
    setSearchInput(val);
    setIsDropdownOpen(true);
    const results = searchLocations(val, 8);
    setSuggestions(results);
  };

  // Select a suggestion from the Facebook-style dropdown
  const handleSelectSuggestion = (item: LocationItem) => {
    const fullText = `${item.city}, ${item.state}, ${item.country}`;
    setSearchInput(fullText);
    setSelectedCountry(item.country);
    setSelectedState(item.state);
    setSelectedCity(item.city);
    setCustomCityInput(item.city);
    setIsDropdownOpen(false);

    onChange({
      country: item.country,
      city: item.city,
      region: item.state,
    });
  };

  // Cascading updates
  const handleCountryChange = (cName: string) => {
    setSelectedCountry(cName);
    const states = getStatesForCountry(cName);
    const firstState = states.length > 0 ? states[0] : '';
    setSelectedState(firstState);

    let firstCity = '';
    if (firstState) {
      const cities = getCitiesForState(cName, firstState);
      firstCity = cities.length > 0 ? cities[0] : '';
    }
    setSelectedCity(firstCity);
    setCustomCityInput(firstCity);

    const fullText = firstCity ? `${firstCity}${firstState ? `, ${firstState}` : ''}, ${cName}` : cName;
    setSearchInput(fullText);

    onChange({
      country: cName,
      city: firstCity,
      region: firstState,
    });
  };

  const handleStateChange = (sName: string) => {
    setSelectedState(sName);
    const cities = getCitiesForState(selectedCountry, sName);
    const firstCity = cities.length > 0 ? cities[0] : '';
    setSelectedCity(firstCity);
    setCustomCityInput(firstCity);

    const fullText = firstCity ? `${firstCity}, ${sName}, ${selectedCountry}` : `${sName}, ${selectedCountry}`;
    setSearchInput(fullText);

    onChange({
      country: selectedCountry,
      city: firstCity,
      region: sName,
    });
  };

  const handleCityChange = (cityName: string) => {
    setSelectedCity(cityName);
    setCustomCityInput(cityName);

    const fullText = `${cityName}${selectedState ? `, ${selectedState}` : ''}, ${selectedCountry}`;
    setSearchInput(fullText);

    onChange({
      country: selectedCountry,
      city: cityName,
      region: selectedState,
    });
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`space-y-3.5 ${className}`} ref={containerRef}>
      {/* 1. Header with Facebook Pill Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center">
            <Globe className="w-3.5 h-3.5" />
          </div>
          <label className="text-xs font-bold text-stone-100 uppercase tracking-wider">
            {label}
          </label>
        </div>
        <button
          type="button"
          onClick={() => setShowCascading(!showCascading)}
          className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 bg-stone-900 px-2.5 py-1 rounded-lg border border-stone-800 transition cursor-pointer"
        >
          <Layers className="w-3 h-3" />
          <span>{showCascading ? 'Hide Dropdowns' : 'Choose by Country / State'}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${showCascading ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* 2. FACEBOOK SMART SEARCH INPUT (Matches FB Profile UI) */}
      <div className="relative">
        <div className="relative flex items-center bg-stone-900 border-2 border-stone-700 hover:border-blue-500 focus-within:border-blue-500 rounded-2xl transition shadow-md">
          <div className="pl-3.5 text-stone-400">
            <Search className="w-4 h-4 text-blue-400" />
          </div>
          <input
            type="text"
            value={searchInput}
            onFocus={() => {
              setIsDropdownOpen(true);
              setSuggestions(searchLocations(searchInput, 8));
            }}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent px-3 py-3 text-stone-100 text-xs sm:text-sm placeholder-stone-500 focus:outline-none"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSuggestions(searchLocations('', 8));
                setIsDropdownOpen(true);
              }}
              className="mr-3 p-1 text-stone-400 hover:text-white rounded-full hover:bg-stone-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Facebook-style Suggestion Dropdown Popover */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-stone-900 border border-stone-700 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-80 overflow-y-auto divide-y divide-stone-800/90 animate-in fade-in slide-in-from-top-1">
            <div className="px-4 py-2 bg-stone-950/90 text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1 text-blue-400">
                <Sparkles className="w-3 h-3" /> Facebook-style Suggestions
              </span>
              <span className="text-stone-500">Click to select location</span>
            </div>

            {suggestions.length > 0 ? (
              suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(item)}
                  className="p-3.5 hover:bg-stone-800 cursor-pointer transition flex items-start gap-3.5 group"
                >
                  {/* FB Style Rounded Grey Pin Box (Exactly like Facebook) */}
                  <div className="w-10 h-10 rounded-xl bg-stone-800 group-hover:bg-blue-600/20 text-stone-400 group-hover:text-blue-400 flex items-center justify-center shrink-0 border border-stone-700/60 group-hover:border-blue-500/40 transition shadow-sm">
                    <MapPin className="w-5 h-5 fill-current opacity-90" />
                  </div>

                  {/* Location Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-stone-100 group-hover:text-blue-300 transition truncate">
                      {item.city}, {item.state}
                    </div>
                    <div className="text-[11px] text-stone-400 font-medium truncate">
                      {item.country}
                    </div>
                    {item.populationBadge && (
                      <div className="text-[10px] text-stone-500 mt-0.5 truncate">
                        {item.populationBadge}
                      </div>
                    )}
                  </div>

                  <div className="self-center opacity-0 group-hover:opacity-100 transition">
                    <Check className="w-4 h-4 text-blue-400" />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-stone-400 text-xs">
                <p>No exact match for "{searchInput}"</p>
                <p className="text-[11px] text-stone-500 mt-1">
                  Use the dropdown selectors below to pick Country and City.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. CASCADING COUNTRY -> STATE -> CITY DROPDOWNS (Always available or expandable) */}
      {(showCascading || !city) && (
        <div className="space-y-3 bg-stone-950/80 p-4 rounded-2xl border border-stone-800 animate-in fade-in">
          <div className="text-[11px] font-bold text-stone-300 flex items-center justify-between pb-1 border-b border-stone-800">
            <span className="flex items-center gap-1.5 text-rose-400">
              <Layers className="w-3.5 h-3.5" /> Direct Country & City Dropdowns:
            </span>
            <span className="text-[10px] text-stone-500">Auto-updates location</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Country Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-stone-400 flex items-center gap-1">
                <Globe className="w-3 h-3 text-rose-400" /> 1. Select Country
              </label>
              <div className="relative">
                <select
                  value={selectedCountry}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className="w-full bg-stone-800 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-rose-500 appearance-none cursor-pointer pr-8"
                >
                  <option value="">-- Choose Country --</option>
                  {WORLD_COUNTRIES.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.flag} {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* State / Division Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-stone-400 flex items-center gap-1">
                <Building className="w-3 h-3 text-rose-400" /> 2. Division / State
              </label>
              <div className="relative">
                <select
                  value={selectedState}
                  onChange={(e) => handleStateChange(e.target.value)}
                  disabled={!selectedCountry || availableStates.length === 0}
                  className="w-full bg-stone-800 disabled:opacity-50 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-rose-500 appearance-none cursor-pointer pr-8"
                >
                  <option value="">-- Choose State / Division --</option>
                  {availableStates.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* City Dropdown */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-stone-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-rose-400" /> 3. Select City
              </label>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                  disabled={!selectedState || availableCities.length === 0}
                  className="w-full bg-stone-800 disabled:opacity-50 border border-stone-700 rounded-xl px-3 py-2 text-stone-100 text-xs focus:outline-none focus:border-rose-500 appearance-none cursor-pointer pr-8"
                >
                  <option value="">-- Choose City --</option>
                  {availableCities.map((ct) => (
                    <option key={ct} value={ct}>
                      {ct}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Active Location Selected Summary Badge */}
      {(city || country) && (
        <div className="flex items-center justify-between px-3.5 py-2 bg-gradient-to-r from-blue-950/40 via-stone-900 to-rose-950/40 rounded-xl border border-stone-800 text-xs">
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="text-stone-400 text-[11px]">Saved Location:</span>
            <span className="font-bold text-white truncate">
              {city ? `${city}, ` : ''}{region ? `${region}, ` : ''}{country}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/60 shrink-0">
            ✓ Ready
          </span>
        </div>
      )}
    </div>
  );
};
