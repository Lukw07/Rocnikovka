/**
 * Market Browser Component
 * Hlavní komponenta pro procházení marketplace
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { TrendingUp, TrendingDown, Eye, ShoppingCart, Search, Filter } from 'lucide-react';

interface MarketFilters {
  itemType?: string;
  rarity?: string;
  minPrice?: number;
  maxPrice?: number;
  searchQuery?: string;
  sortBy?: string;
}

interface MarketListing {
  id: string;
  itemId: string;
  sellerId: string;
  quantity: number;
  pricePerUnit: number;
  originalPrice: number;
  gemPrice: number;
  demandMultiplier: number;
  trendingScore: number;
  views: number;
  status: string;
  item: {
    id: string;
    name: string;
    description: string;
    imageUrl?: string;
    rarity: string;
    type: string;
  };
  createdAt: string;
}

export default function MarketBrowser() {
  const [listings, setListings] = useState<MarketListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<MarketFilters>({
    sortBy: 'recent',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchListings();
  }, [filters, page]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== '') {
            acc[key] = value.toString();
          }
          return acc;
        }, {} as Record<string, string>),
      });

      const response = await fetch(`/api/marketplace?${params}`);
      const data = await response.json();
      
      setListings(data.listings || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof MarketFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1); // Reset to first page
  };

  const getRarityColor = (rarity: string) => {
    const colors: Record<string, string> = {
      COMMON: 'bg-gray-500',
      UNCOMMON: 'bg-green-500',
      RARE: 'bg-blue-500',
      EPIC: 'bg-purple-500',
      LEGENDARY: 'bg-orange-500',
    };
    return colors[rarity] || 'bg-gray-500';
  };

  const getPriceChangeIndicator = (listing: MarketListing) => {
    const change = ((listing.pricePerUnit - listing.originalPrice) / listing.originalPrice) * 100;
    if (Math.abs(change) < 1) return null;
    
    return change > 0 ? (
      <div className="flex items-center text-green-600 text-sm">
        <TrendingUp className="w-4 h-4 mr-1" />
        +{change.toFixed(1)}%
      </div>
    ) : (
      <div className="flex items-center text-red-600 text-sm">
        <TrendingDown className="w-4 h-4 mr-1" />
        {change.toFixed(1)}%
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search items..."
                  value={filters.searchQuery || ''}
                  onChange={(e) => handleFilterChange('searchQuery', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Rarity filter */}
            <Select
              value={filters.rarity || 'all'}
              onValueChange={(value) => handleFilterChange('rarity', value === 'all' ? undefined : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All rarities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Rarities</SelectItem>
                <SelectItem value="COMMON">Common</SelectItem>
                <SelectItem value="UNCOMMON">Uncommon</SelectItem>
                <SelectItem value="RARE">Rare</SelectItem>
                <SelectItem value="EPIC">Epic</SelectItem>
                <SelectItem value="LEGENDARY">Legendary</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort by */}
            <Select
              value={filters.sortBy || 'recent'}
              onValueChange={(value) => handleFilterChange('sortBy', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recently Listed</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="popularity">Most Popular</SelectItem>
                <SelectItem value="trending">Trending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price range */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <Input
              type="number"
              placeholder="Min price"
              value={filters.minPrice || ''}
              onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
            />
            <Input
              type="number"
              placeholder="Max price"
              value={filters.maxPrice || ''}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Listings Grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading marketplace...</p>
        </div>
      ) : listings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600">No listings found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{listing.item.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getRarityColor(listing.item.rarity)}>
                          {listing.item.rarity}
                        </Badge>
                        {listing.trendingScore > 70 && (
                          <Badge variant="outline" className="text-orange-600 border-orange-600">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            HOT
                          </Badge>
                        )}
                      </div>
                    </div>
                    {listing.item.imageUrl && (
                      <img 
                        src={listing.item.imageUrl} 
                        alt={listing.item.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <CardDescription className="line-clamp-2">
                    {listing.item.description}
                  </CardDescription>

                  <div className="space-y-2">
                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-yellow-600">
                          {listing.pricePerUnit} 🪙
                        </p>
                        {listing.gemPrice > 0 && (
                          <p className="text-sm text-purple-600">
                            or {listing.gemPrice} 💎
                          </p>
                        )}
                      </div>
                      {getPriceChangeIndicator(listing)}
                    </div>

                    {/* Quantity & Views */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Qty: {listing.quantity}</span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {listing.views}
                      </span>
                    </div>

                    {/* Demand indicator */}
                    {listing.demandMultiplier > 1.2 && (
                      <Badge variant="outline" className="w-full justify-center text-green-600 border-green-600">
                        High Demand +{((listing.demandMultiplier - 1) * 100).toFixed(0)}%
                      </Badge>
                    )}
                    {listing.demandMultiplier < 0.8 && (
                      <Badge variant="outline" className="w-full justify-center text-blue-600 border-blue-600">
                        Good Deal -{((1 - listing.demandMultiplier) * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 space-y-2">
                    <Button 
                      className="w-full"
                      onClick={() => window.location.href = `/marketplace/${listing.id}`}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <span className="flex items-center px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
