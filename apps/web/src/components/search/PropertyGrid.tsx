'use client';

import { Button } from '@/components/ui/button';
import { useEffect, useRef } from 'react';
import { PropertyCard } from './PropertyCard';

// Flexible Property interface that handles both data structures
interface Property {
  id: string | number;
  title: string;
  // Location fields (different sources use different names)
  address?: string;
  location?: string;
  // Image fields (some use single, some use array)
  image?: string;
  images?: string[];
  // Guest capacity fields (different names in different sources)
  maxPeople?: number;
  maxGuests?: number;
  // Distance can be string or number
  distance?: string | number;
  rating: number;
  // Review fields (different names)
  reviews?: number;
  reviewCount?: number;
  // Optional fields
  area?: number;
  price: number;
  currency?: string;
  period?: string;
  verified?: boolean;
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
}

interface PropertyGridProps {
  properties?: Property[];
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
}

// Default mock data for when no properties are passed
const defaultMockProperties: Property[] = [
  {
    id: 1,
    title: 'Luxury Studio in SoHo',
    address: '158 Greene St, New York, NY',
    image: '/images/house1.webp',
    maxPeople: 2,
    distance: 0.8,
    rating: 4.8,
    reviews: 114,
    area: 40,
    price: 3200,
    currency: 'USD',
    period: 'per month',
    verified: true,
  },
  {
    id: 2,
    title: 'Modern Loft in Downtown',
    address: '1122 S Main St, Los Angeles, CA',
    image: '/images/house2.webp',
    maxPeople: 2,
    distance: 1.5,
    rating: 4.6,
    reviews: 54,
    area: 55,
    price: 2800,
    currency: 'USD',
    period: 'per month',
    verified: true,
  },
  {
    id: 3,
    title: 'Penthouse in Brickell',
    address: '950 Brickell Bay Dr, Miami, FL',
    image: '/images/house3.webp',
    maxPeople: 4,
    distance: 2.0,
    rating: 4.9,
    reviews: 84,
    area: 100,
    price: 5100,
    currency: 'USD',
    period: 'per month',
    verified: true,
  },
  {
    id: 4,
    title: 'Cozy Condo near Pike Place',
    address: '1410 2nd Ave, Seattle, WA',
    image: '/images/house4.webp',
    maxPeople: 2,
    distance: 1.8,
    rating: 4.2,
    reviews: 162,
    area: 50,
    price: 2950,
    currency: 'USD',
    period: 'per month',
    verified: true,
  },
  {
    id: 5,
    title: 'Designer Apartment',
    address: '1234 Design St, San Francisco, CA',
    image: '/images/house5.webp',
    maxPeople: 3,
    distance: 1.2,
    rating: 4.7,
    reviews: 89,
    area: 65,
    price: 3800,
    currency: 'USD',
    period: 'per month',
    verified: true,
  },
  {
    id: 6,
    title: 'Waterfront Home in Santa Monica',
    address: '567 Ocean Blvd, Santa Monica, CA',
    image: '/images/house.webp',
    maxPeople: 6,
    distance: 0.5,
    rating: 4.9,
    reviews: 203,
    area: 120,
    price: 7500,
    currency: 'USD',
    period: 'per month',
    verified: true,
  },
  {
    id: 7,
    title: 'High-Rise in The Loop',
    address: '789 Michigan Ave, Chicago, IL',
    image: '/images/house1.webp',
    maxPeople: 2,
    distance: 1.1,
    rating: 4.5,
    reviews: 76,
    area: 45,
    price: 2600,
    currency: 'USD',
    period: 'per month',
    verified: true,
  },
  {
    id: 8,
    title: 'Smart Home in Austin',
    address: '321 Tech Blvd, Austin, TX',
    image: '/images/house2.webp',
    maxPeople: 4,
    distance: 2.3,
    rating: 4.8,
    reviews: 95,
    area: 85,
    price: 4200,
    currency: 'USD',
    period: 'per month',
    verified: true,
  },
];

export const PropertyGrid = ({
  properties,
  onLoadMore,
  hasMore = false,
  isLoading = false,
}: PropertyGridProps) => {
  const observerTarget = useRef<HTMLDivElement>(null);

  // Use passed properties or fall back to default mock data
  const displayProperties = properties || defaultMockProperties;

  // Transform properties to match PropertyCard expectations
  const transformedProperties = displayProperties.map((prop) => {
    // Ensure ID is always a number for PropertyCard
    const numericId = typeof prop.id === 'string' ? Number.parseInt(prop.id, 10) : prop.id;

    // Parse distance to number if it's a string like "30km"
    let numericDistance: number;
    if (typeof prop.distance === 'string') {
      const parsed = Number.parseFloat(prop.distance);
      numericDistance = Number.isNaN(parsed) ? 0 : parsed;
    } else {
      numericDistance = prop.distance || 0;
    }

    return {
      id: numericId,
      title: prop.title,
      address: prop.address || prop.location || '',
      image: prop.image || prop.images?.[0] || '/images/house.webp',
      maxPeople: prop.maxPeople || prop.maxGuests || 2,
      distance: numericDistance,
      rating: prop.rating,
      reviews: prop.reviews || prop.reviewCount || 0,
      area: prop.area || (prop.bedrooms ? prop.bedrooms * 25 : 50),
      price: prop.price,
      currency: prop.currency || 'USD',
      period: prop.period || 'per month',
      verified: prop.verified !== undefined ? prop.verified : true,
    };
  });

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, onLoadMore]);

  if (transformedProperties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-4">
          No properties found matching your criteria
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reset Filters
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {transformedProperties.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>

      {/* Intersection Observer target for infinite scroll */}
      {hasMore && onLoadMore && (
        <div ref={observerTarget} className="w-full h-10 mt-4" aria-hidden="true" />
      )}

      {/* Manual Load More button as fallback */}
      {hasMore && onLoadMore && !isLoading && (
        <div className="flex justify-center mt-8">
          <Button variant="outline" onClick={onLoadMore} disabled={isLoading}>
            Load More Properties
          </Button>
        </div>
      )}
    </>
  );
};
