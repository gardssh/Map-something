import { useState, useEffect, useCallback } from 'react';

export interface Position {
  latitude: number;
  longitude: number;
  altitude: number | null;
  accuracy: number;
  speed: number | null;
  timestamp: number;
}

interface ActivityRecording {
  isRecording: boolean;
  positions: Position[];
  currentPosition: Position | null;
  startTime: number | null;
  elapsedTime: number;
  distance: number;
  averageSpeed: number;
  currentSpeed: number | null;
  error: string | null;
}

export const useActivityRecording = () => {
  const [recording, setRecording] = useState<ActivityRecording>({
    isRecording: false,
    positions: [],
    currentPosition: null,
    startTime: null,
    elapsedTime: 0,
    distance: 0,
    averageSpeed: 0,
    currentSpeed: null,
    error: null
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  const calculateDistance = (pos1: Position, pos2: Position): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (pos1.latitude * Math.PI) / 180;
    const φ2 = (pos2.latitude * Math.PI) / 180;
    const Δφ = ((pos2.latitude - pos1.latitude) * Math.PI) / 180;
    const Δλ = ((pos2.longitude - pos1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handlePositionUpdate = useCallback(
    (position: GeolocationPosition) => {
      const newPosition: Position = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
        timestamp: position.timestamp,
      };

      setRecording((prev) => {
        const positions = [...prev.positions, newPosition];
        let distance = prev.distance;

        if (positions.length > 1) {
          const lastPos = positions[positions.length - 2];
          distance += calculateDistance(lastPos, newPosition);
        }

        const elapsedTime = prev.startTime
          ? (position.timestamp - prev.startTime) / 1000
          : 0;

        const averageSpeed = elapsedTime > 0 ? distance / elapsedTime : 0;

        return {
          ...prev,
          positions,
          currentPosition: newPosition,
          distance,
          elapsedTime,
          averageSpeed,
          currentSpeed: newPosition.speed,
          error: null
        };
      });
    },
    []
  );

  const startRecording = useCallback(async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      // First, request permission
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'denied') {
        throw new Error('Location permission denied. Please enable location services to record activities.');
      }

      // Get initial position to verify it works
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });

      const id = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        (error) => {
          console.error('Error getting location:', error);
          setRecording(prev => ({
            ...prev,
            error: `Location error: ${error.message}`
          }));
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );

      setWatchId(id);
      setRecording((prev) => ({
        ...prev,
        isRecording: true,
        startTime: Date.now(),
        positions: [],
        distance: 0,
        elapsedTime: 0,
        error: null
      }));
    } catch (error) {
      console.error('Error starting recording:', error);
      setRecording(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to start recording'
      }));
    }
  }, [handlePositionUpdate]);

  const stopRecording = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }

    setRecording((prev) => ({
      ...prev,
      isRecording: false,
      error: null
    }));
  }, [watchId]);

  const resetRecording = useCallback(() => {
    setRecording({
      isRecording: false,
      positions: [],
      currentPosition: null,
      startTime: null,
      elapsedTime: 0,
      distance: 0,
      averageSpeed: 0,
      currentSpeed: null,
      error: null
    });
  }, []);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    ...recording,
    startRecording,
    stopRecording,
    resetRecording,
  };
}; 