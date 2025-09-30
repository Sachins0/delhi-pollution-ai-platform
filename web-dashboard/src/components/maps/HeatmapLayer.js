import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const HeatmapLayer = ({ points, options = {} }) => {
  const map = useMap();
  const [heatLayer, setHeatLayer] = useState(null);

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Only proceed if map container has width and height > 0
    const container = map.getContainer();
    if (!container || container.clientHeight === 0 || container.clientWidth === 0) {
      // Delay adding layer until map container is properly sized
      const handleResize = () => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          // timeout to ensure layout settles
          setTimeout(() => {
            // remove old layer and add new one
            if (heatLayer) {
              heatLayer.remove();
            }
            const layer = L.heatLayer(points, {
              radius: 25,
              blur: 15,
              maxZoom: 18,
              gradient: {
                0.0: '#00e400',
                0.2: '#ffff00',
                0.4: '#ff7e00',
                0.6: '#ff0000',
                0.8: '#8f3f97',
                1.0: '#7e0023'
              },
              ...options
            }).addTo(map);
            setHeatLayer(layer);

            map.off('resize', handleResize);
          }, 300);
        }
      };

      map.on('resize', handleResize);

      return () => {
        map.off('resize', handleResize);
      };
    }

    // Otherwise add or update heatmap layer immediately
    if (heatLayer) {
      heatLayer.setLatLngs(points);
    } else {
      const layer = L.heatLayer(points, {
        radius: 25,
        blur: 15,
        maxZoom: 18,
        gradient: {
          0.0: '#00e400',
          0.2: '#ffff00',
          0.4: '#ff7e00',
          0.6: '#ff0000',
          0.8: '#8f3f97',
          1.0: '#7e0023'
        },
        ...options
      }).addTo(map);
      setHeatLayer(layer);
    }

    // Cleanup on unmount
    return () => {
      if (heatLayer) {
        heatLayer.remove();
        setHeatLayer(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, points]);

  return null;
};

export default HeatmapLayer;
