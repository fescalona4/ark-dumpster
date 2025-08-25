'use client';

import * as React from 'react';
import { IconMapPin, IconNavigation, IconClock, IconRoute } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useGeolocation, calculateDistance, formatDistance, useLocationPermission } from '@/hooks/useGeolocation';
import { MobileOrderCard } from './mobile-order-card';
import { cn } from '@/lib/utils';

interface OrderData {
  id: number;
  header: string; // Customer name
  type: string; // Dumpster size
  status: string;
  target: string; // Delivery date
  limit: string; // Final price
  reviewer: string; // Email
  address?: string;
  city?: string;
  state?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface NearbyOrdersProps {
  orders: OrderData[];
  onOrderSelect?: (order: OrderData) => void;
  maxDistance?: number; // miles
  className?: string;
}

export function NearbyOrders({ 
  orders, 
  onOrderSelect, 
  maxDistance = 25,
  className 
}: NearbyOrdersProps) {
  const { position, loading, error, getCurrentPosition } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 10000,
  });
  const { permission, requestPermission } = useLocationPermission();

  // Calculate distances and sort by proximity
  const nearbyOrders = React.useMemo(() => {
    if (!position || !orders.length) return [];

    const userLat = position.coords.latitude;
    const userLng = position.coords.longitude;

    return orders
      .filter(order => order.coordinates) // Only orders with coordinates
      .map(order => {
        const distance = calculateDistance(
          userLat,
          userLng,
          order.coordinates!.lat,
          order.coordinates!.lng
        );
        return { ...order, distance };
      })
      .filter(order => order.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance);
  }, [position, orders, maxDistance]);

  const handleLocationRequest = async () => {
    if (permission === 'denied') {
      alert('Location access denied. Please enable location in your browser settings.');
      return;
    }
    
    const granted = await requestPermission();
    if (granted) {
      getCurrentPosition();
    }
  };

  const openDirections = (order: OrderData) => {
    if (!order.coordinates) return;
    
    const { lat, lng } = order.coordinates;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  if (permission === 'denied') {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground mb-4">
            <IconMapPin className="h-12 w-12 mx-auto mb-2" />
            <h3 className="font-semibold text-lg">Location Access Needed</h3>
            <p className="text-sm mt-2">
              Enable location access to see nearby orders and get directions
            </p>
          </div>
          <Button onClick={handleLocationRequest} size="touch">
            <IconNavigation className="h-4 w-4 mr-2" />
            Enable Location
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Getting your location...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <div className="text-muted-foreground mb-4">
            <IconMapPin className="h-12 w-12 mx-auto mb-2 text-red-500" />
            <h3 className="font-semibold text-lg">Location Error</h3>
            <p className="text-sm mt-2">
              {error.code === 1 ? 'Location access denied' :
               error.code === 2 ? 'Location unavailable' :
               'Location request timed out'}
            </p>
          </div>
          <Button onClick={getCurrentPosition} variant="outline" size="touch">
            <IconNavigation className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!position) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <Button onClick={handleLocationRequest} size="touch">
            <IconNavigation className="h-4 w-4 mr-2" />
            Find Nearby Orders
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">Nearby Orders</h3>
        <Button 
          onClick={getCurrentPosition} 
          variant="ghost" 
          size="sm"
          disabled={loading}
        >
          <IconNavigation className={cn('h-4 w-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {nearbyOrders.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <IconMapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
            <h4 className="font-medium mb-2">No nearby orders</h4>
            <p className="text-sm text-muted-foreground">
              No orders within {maxDistance} miles of your location
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {nearbyOrders.map((order) => (
            <div key={order.id} className="relative">
              <MobileOrderCard
                order={order}
                onTap={onOrderSelect}
                className="pr-20" // Make space for distance badge
              />
              
              {/* Distance badge and directions button */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  <IconMapPin className="h-3 w-3 mr-1" />
                  {formatDistance(order.distance!)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openDirections(order)}
                  className="h-8 w-8 p-0"
                >
                  <IconRoute className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Route optimization component
interface RouteOptimizationProps {
  orders: (OrderData & { distance?: number })[];
  className?: string;
}

export function RouteOptimization({ orders, className }: RouteOptimizationProps) {
  const [optimizedRoute, setOptimizedRoute] = React.useState<OrderData[]>([]);
  const [totalDistance, setTotalDistance] = React.useState<number>(0);
  const [estimatedTime, setEstimatedTime] = React.useState<number>(0);

  // Simple route optimization (nearest neighbor algorithm)
  const optimizeRoute = React.useCallback(() => {
    if (orders.length <= 1) {
      setOptimizedRoute(orders);
      return;
    }

    const unvisited = [...orders];
    const route: OrderData[] = [];
    let currentOrder = unvisited.shift()!; // Start with first order
    route.push(currentOrder);
    
    let totalDist = 0;

    while (unvisited.length > 0) {
      let nearest = unvisited[0];
      let nearestDistance = Infinity;
      let nearestIndex = 0;

      unvisited.forEach((order, index) => {
        if (currentOrder.coordinates && order.coordinates) {
          const distance = calculateDistance(
            currentOrder.coordinates.lat,
            currentOrder.coordinates.lng,
            order.coordinates.lat,
            order.coordinates.lng
          );
          
          if (distance < nearestDistance) {
            nearest = order;
            nearestDistance = distance;
            nearestIndex = index;
          }
        }
      });

      route.push(nearest);
      totalDist += nearestDistance;
      unvisited.splice(nearestIndex, 1);
      currentOrder = nearest;
    }

    setOptimizedRoute(route);
    setTotalDistance(totalDist);
    setEstimatedTime(Math.round(totalDist * 2.5)); // Rough estimate: 2.5 minutes per mile
  }, [orders]);

  React.useEffect(() => {
    optimizeRoute();
  }, [optimizeRoute]);

  const openOptimizedRoute = () => {
    if (optimizedRoute.length === 0) return;

    const waypoints = optimizedRoute
      .filter(order => order.coordinates)
      .map(order => `${order.coordinates!.lat},${order.coordinates!.lng}`)
      .join('|');

    const url = `https://www.google.com/maps/dir/?api=1&waypoints=${waypoints}&travelmode=driving`;
    window.open(url, '_blank');
  };

  if (orders.length <= 1) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <IconRoute className="h-5 w-5" />
          Route Optimization
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Distance:</span>
            <span className="font-medium">{formatDistance(totalDistance)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimated Time:</span>
            <span className="font-medium flex items-center">
              <IconClock className="h-4 w-4 mr-1" />
              {estimatedTime}min
            </span>
          </div>
          
          <Button 
            onClick={openOptimizedRoute}
            className="w-full"
            size="touch"
          >
            <IconNavigation className="h-4 w-4 mr-2" />
            Open in Maps
          </Button>

          <div className="space-y-2 pt-2 border-t">
            <p className="text-xs text-muted-foreground font-medium">Optimized Route:</p>
            {optimizedRoute.map((order, index) => (
              <div key={order.id} className="flex items-center text-sm">
                <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium mr-3">
                  {index + 1}
                </div>
                <div className="flex-1 truncate">
                  <div className="font-medium">{order.header}</div>
                  <div className="text-xs text-muted-foreground">{order.type}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}