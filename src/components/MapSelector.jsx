import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Search, Navigation } from 'lucide-react';

export default function MapSelector({ location, onChange }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState(location?.address || '');
  const [searching, setSearching] = useState(false);

  // Set default coordinates if not provided (Medellin, Colombia)
  const defaultLat = 6.2518;
  const defaultLng = -75.5636;
  const currentLat = location?.lat || defaultLat;
  const currentLng = location?.lng || defaultLng;

  useEffect(() => {
    // Check if L (Leaflet) is available on the window object
    if (!window.L) {
      console.error('Leaflet is not loaded from CDN');
      return;
    }

    const L = window.L;

    // Initialize map if it doesn't exist
    if (!mapRef.current) {
      mapRef.current = L.map('map-container').setView([currentLat, currentLng], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      // Create draggable marker
      markerRef.current = L.marker([currentLat, currentLng], {
        draggable: true
      }).addTo(mapRef.current);

      // Listen for marker drag event
      markerRef.current.on('dragend', async function (e) {
        const position = markerRef.current.getLatLng();
        await updateLocation(position.lat, position.lng);
      });

      // Listen for map click event to move pin
      mapRef.current.on('click', async function (e) {
        const { lat, lng } = e.latlng;
        markerRef.current.setLatLng([lat, lng]);
        await updateLocation(lat, lng);
      });
    } else {
      // If coordinates changed externally, update map view
      mapRef.current.setView([currentLat, currentLng]);
      markerRef.current.setLatLng([currentLat, currentLng]);
    }

    // Cleanup map on unmount
    return () => {
      if (mapRef.current) {
        // We do not destroy the map container completely to avoid issues, 
        // but removing the map reference helps React cleanup.
      }
    };
  }, [currentLat, currentLng]);

  // Update Lat/Lng and fetch address using Nominatim (reverse geocoding)
  const updateLocation = async (lat, lng) => {
    let address = 'Ubicación seleccionada en mapa';
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'Accept-Language': 'es'
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        address = data.display_name || data.name || address;
        // Clean up address (take first few parts if it is too long)
        const parts = address.split(',');
        if (parts.length > 4) {
          address = parts.slice(0, 4).join(',').trim();
        }
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }

    setSearchQuery(address);
    onChange({ lat, lng, address });
  };

  // Search address (geocoding)
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            'Accept-Language': 'es'
          }
        }
      );
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const { lat, lon, display_name } = data[0];
          const newLat = parseFloat(lat);
          const newLng = parseFloat(lon);
          
          let cleanAddress = display_name;
          const parts = cleanAddress.split(',');
          if (parts.length > 4) {
            cleanAddress = parts.slice(0, 4).join(',').trim();
          }

          setSearchQuery(cleanAddress);
          onChange({ lat: newLat, lng: newLng, address: cleanAddress });

          if (mapRef.current && markerRef.current) {
            mapRef.current.setView([newLat, newLng], 15);
            markerRef.current.setLatLng([newLat, newLng]);
          }
        } else {
          alert('No se encontró la dirección. Intenta arrastrando el pin en el mapa.');
        }
      }
    } catch (err) {
      console.error('Geocoding search error:', err);
      alert('Error al buscar dirección. Intenta arrastrando el pin manualmente.');
    } finally {
      setSearching(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    }
  };

  return (
    <div className="map-selector-component" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '35px' }}
            placeholder="Buscar dirección (ej: Poblado, Medellín)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-cyan)' }} />
        </div>
        <button type="button" className="btn btn-secondary" onClick={handleSearch} disabled={searching}>
          {searching ? '...' : <Search size={16} />}
        </button>
      </div>

      <div id="map-container" style={{ position: 'relative' }}>
        {/* Leaflet binds to this element */}
      </div>

      <div style={{ display: 'flex', gap: '15px', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
        <div><strong>Lat:</strong> {currentLat.toFixed(5)}</div>
        <div><strong>Lng:</strong> {currentLng.toFixed(5)}</div>
        <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={location?.address}>
          <strong>Dirección:</strong> {location?.address || 'Ubicación de obra'}
        </div>
      </div>
    </div>
  );
}
