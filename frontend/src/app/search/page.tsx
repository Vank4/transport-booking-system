'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import axios from 'axios';
import {
    Plane, Train, Filter, ChevronLeft, ChevronRight, Loader2, AlertCircle
} from 'lucide-react';
import Link from 'next/link';

// --- DATA MẪU CHO DANH SÁCH SÂN BAY & GA TÀU ---
const AIRPORTS = [
    { code: 'SGN', name: 'Hồ Chí Minh (SGN)' },
    { code: 'HAN', name: 'Hà Nội (HAN)' },
    { code: 'DAD', name: 'Đà Nẵng (DAD)' },
    { code: 'CXR', name: 'Nha Trang (CXR)' },
    { code: 'PQC', name: 'Phú Quốc (PQC)' }
];

const STATIONS = [
    { code: 'Sài Gòn', name: 'Ga Sài Gòn' },
    { code: 'Hà Nội', name: 'Ga Hà Nội' },
    { code: 'Nha Trang', name: 'Ga Nha Trang' },
    { code: 'Đà Nẵng', name: 'Ga Đà Nẵng' },
    { code: 'Huế', name: 'Ga Huế' }
];

function SearchResults() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const type = searchParams.get('type') || 'flight';
    const origin = searchParams.get('origin') || '';
    const destination = searchParams.get('destination') || '';
    const departureDate = searchParams.get('departure_date') || '';
    const passengers = searchParams.get('passengers') || '1';
    const sort = searchParams.get('sort') || 'price:asc'; // Lấy param Sắp xếp
    const page = parseInt(searchParams.get('page') || '1');

    const [searchType, setSearchType] = useState(type);
    const [searchOrigin, setSearchOrigin] = useState(origin);
    const [searchDest, setSearchDest] = useState(destination);
    const [searchDate, setSearchDate] = useState(departureDate);

    const [results, setResults] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // 🔥 Thêm BaseFilterCounts để khóa số đếm
    const [baseFilterCounts, setBaseFilterCounts] = useState<any>({});

    const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
    const [selectedAirlines, setSelectedAirlines] = useState<string[]>(searchParams.get('airlines')?.split(',').filter(Boolean) || []);
    const [selectedTimes, setSelectedTimes] = useState<string[]>(searchParams.get('times')?.split(',').filter(Boolean) || []);
    const [selectedStops, setSelectedStops] = useState<string[]>(searchParams.get('stops')?.split(',').filter(Boolean) || []);

    const updateURL = (newParams: Record<string, string | number>) => {
        const params = new URLSearchParams(searchParams.toString());
        Object.entries(newParams).forEach(([key, value]) => {
            if (value) params.set(key, value.toString());
            else params.delete(key);
        });
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleSearchSubmit = () => {
        updateURL({ type: searchType, origin: searchOrigin, destination: searchDest, departure_date: searchDate, page: 1 });
        setMinPrice(''); setMaxPrice(''); setSelectedAirlines([]); setSelectedTimes([]); setSelectedStops([]);
    };

    const handleApplyFilter = () => {
        updateURL({ min_price: minPrice, max_price: maxPrice, airlines: selectedAirlines.join(','), times: selectedTimes.join(','), stops: selectedStops.join(','), page: 1 });
    };

    const toggleArrayItem = (arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
        setArr(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };

    useEffect(() => {
        const fetchResults = async () => {
            if (!origin || !destination || !departureDate) return setLoading(false);
            setLoading(true); setError('');
            try {
                const query = new URLSearchParams(searchParams.toString()).toString();
                const endpoint = type === 'flight'
                    ? `${process.env.NEXT_PUBLIC_API_URL}/flights/search?${query}`
                    : `${process.env.NEXT_PUBLIC_API_URL}/train-trips/search?${query}`;

                const response = await axios.get(endpoint);
                if (response.data.success) {
                    setResults(response.data.data.items);
                    setTotal(response.data.data.pagination?.totalItems || response.data.data.total);

                    const counts = response.data.data.filter_counts || {};
                    const hasFilters = searchParams.has('airlines') || searchParams.has('times') || searchParams.has('stops') || searchParams.has('min_price') || searchParams.has('max_price');

                    // 🔥 Logic khóa số đếm gốc (chỉ cập nhật nếu chưa có bộ lọc nào được chọn)
                    if (!hasFilters || Object.keys(baseFilterCounts).length === 0) {
                        setBaseFilterCounts(counts);
                    }
                }
            } catch (err: any) {
                setError(err.response?.data?.message || 'Không tìm thấy chuyến đi phù hợp.');
                setResults([]); setTotal(0);
            } finally {
                setLoading(false);
            }
        };
        fetchResults();

        setSearchType(type); setSearchOrigin(origin); setSearchDest(destination); setSearchDate(departureDate);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams, type, origin, destination, departureDate]);

    const carrierOptions = type === 'flight'
        ? [{ id: 'VN', name: 'Vietnam Airlines' }, { id: 'VJ', name: 'Vietjet Air' }, { id: 'QH', name: 'Bamboo Airways' }]
        : [{ id: 'SE', name: 'SE (Express)' }, { id: 'TN', name: 'TN (Night train)' }, { id: 'L', name: 'Local' }];

    const stopOptions = type === 'flight'
        ? [{ id: 'direct', label: 'Non-stop' }, { id: '1stop', label: '1 stop' }, { id: '2stops', label: '2+ stops' }]
        : [{ id: 'direct', label: 'Direct' }, { id: '1stop', label: '1 transfer' }, { id: '2stops', label: '2+ transfers' }];

    // Lựa chọn danh sách dựa trên loại phương tiện
    const locationList = searchType === 'flight' ? AIRPORTS : STATIONS;

    return (
        <div className="min-h-screen bg-gray-50 pt-24 pb-12">
            <div className="max-w-7xl mx-auto px-4">

                {/* --- TOP BAR (Đã cập nhật Select Box) --- */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between z-20 relative">
                    <div className="flex flex-wrap gap-4 w-full md:w-auto">

                        {/* Dropdown Từ (Origin) */}
                        <div className="flex flex-col flex-1 min-w-[140px]">
                            <span className="text-[10px] text-gray-500 font-bold ml-1 mb-1 uppercase tracking-wider">From</span>
                            <select
                                value={searchOrigin}
                                onChange={e => setSearchOrigin(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:border-blue-500 focus:ring-1 outline-none cursor-pointer bg-white"
                            >
                                <option value="" disabled>-- Chọn điểm đi --</option>
                                {locationList.map(loc => (
                                    <option key={loc.code} value={loc.code}>{loc.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Dropdown Đến (Destination) */}
                        <div className="flex flex-col flex-1 min-w-[140px]">
                            <span className="text-[10px] text-gray-500 font-bold ml-1 mb-1 uppercase tracking-wider">To</span>
                            <select
                                value={searchDest}
                                onChange={e => setSearchDest(e.target.value)}
                                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold focus:border-blue-500 focus:ring-1 outline-none cursor-pointer bg-white"
                            >
                                <option value="" disabled>-- Chọn điểm đến --</option>
                                {locationList.map(loc => (
                                    <option key={loc.code} value={loc.code}>{loc.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col flex-1 min-w-[140px]">
                            <span className="text-[10px] text-gray-500 font-bold ml-1 mb-1 uppercase tracking-wider">Date</span>
                            <input type="date" value={searchDate} onChange={e => setSearchDate(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:border-blue-500 focus:ring-1 outline-none" />
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                        <button onClick={() => { setSearchType('flight'); setSearchOrigin(''); setSearchDest(''); }} className={`flex-1 md:flex-none px-6 py-2.5 rounded-full text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${searchType === 'flight' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                            <Plane size={16} /> Flights
                        </button>
                        <button onClick={() => { setSearchType('train'); setSearchOrigin(''); setSearchDest(''); }} className={`flex-1 md:flex-none px-6 py-2.5 rounded-full text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${searchType === 'train' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                            <Train size={16} /> Trains
                        </button>
                    </div>

                    <button onClick={handleSearchSubmit} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold shadow-md transition-all">
                        Search
                    </button>
                </div>

                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* --- CỘT TRÁI: BỘ LỌC ĐỘNG --- */}
                    <aside className="w-full lg:w-64 space-y-6 shrink-0 sticky top-24">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 text-lg mb-6">Filters</h3>

                            {/* Price range */}
                            <div className="mb-6">
                                <h4 className="font-bold text-gray-800 mb-3 text-sm">Price range</h4>
                                <div className="flex items-center gap-2">
                                    <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none" />
                                    <span className="text-gray-400">-</span>
                                    <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:border-blue-500 outline-none" />
                                </div>
                            </div>

                            {/* Hãng / Đơn vị */}
                            <div className="mb-6 border-t border-gray-100 pt-6">
                                <h4 className="font-bold text-gray-800 mb-3 text-sm">{type === 'flight' ? 'Airline' : 'Train'}</h4>
                                <div className="space-y-3">
                                    {carrierOptions.map(item => {
                                        // 🔥 Sử dụng baseFilterCounts để số đếm luôn hiển thị
                                        const count = baseFilterCounts.airlines ? (baseFilterCounts.airlines[item.id] || 0) : 0;
                                        return (
                                            <label key={item.id} className="flex justify-between items-center text-sm text-gray-600 cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox" checked={selectedAirlines.includes(item.id)} onChange={() => toggleArrayItem(selectedAirlines, setSelectedAirlines, item.id)} className="rounded border-gray-300 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer" />
                                                    <span>{item.name}</span>
                                                </div>
                                                <span className="text-xs text-gray-400">{count}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Giờ khởi hành */}
                            <div className="mb-6 border-t border-gray-100 pt-6">
                                <h4 className="font-bold text-gray-800 mb-3 text-sm">Departure time</h4>
                                <div className="space-y-3">
                                    {[
                                        { id: 'morning', label: '00:00 - 06:00' },
                                        { id: 'noon', label: '06:00 - 12:00' },
                                        { id: 'afternoon', label: '12:00 - 18:00' },
                                        { id: 'evening', label: '18:00 - 24:00' }
                                    ].map(item => {
                                        // 🔥 Sử dụng baseFilterCounts
                                        const count = baseFilterCounts.departure_time ? (baseFilterCounts.departure_time[item.id] || 0) : 0;
                                        return (
                                            <label key={item.id} className="flex justify-between items-center text-sm text-gray-600 cursor-pointer">
                                                <div className="flex items-center gap-3">
                                                    <input type="checkbox" checked={selectedTimes.includes(item.id)} onChange={() => toggleArrayItem(selectedTimes, setSelectedTimes, item.id)} className="rounded border-gray-300 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer" />
                                                    <span>{item.label}</span>
                                                </div>
                                                <span className="text-xs text-gray-400">{count}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Điểm dừng / Chuyển đổi */}
                            <div className="mb-6 border-t border-gray-100 pt-6">
                                <h4 className="font-bold text-gray-800 mb-3 text-sm">{type === 'flight' ? 'Stops' : 'Transfers'}</h4>
                                <div className="space-y-3">
                                    {stopOptions.map((item, index) => (
                                        <label key={item.id} className="flex justify-between items-center text-sm text-gray-600 cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <input type="checkbox" checked={selectedStops.includes(item.id)} onChange={() => toggleArrayItem(selectedStops, setSelectedStops, item.id)} className="rounded border-gray-300 text-blue-600 focus:ring-0 w-4 h-4 cursor-pointer" />
                                                <span>{item.label}</span>
                                            </div>
                                            <span className="text-xs text-gray-400">{index === 0 && total > 0 ? total : 0}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => { updateURL({ min_price: '', max_price: '', airlines: '', times: '', stops: '', page: 1 }); }} className="flex-1 py-2 rounded-full text-sm font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">Reset</button>
                                <button onClick={handleApplyFilter} className="flex-1 py-2 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 transition-all shadow-md">Apply</button>
                            </div>
                        </div>
                    </aside>

                    {/* --- CỘT PHẢI: KẾT QUẢ --- */}
                    <main className="flex-1">
                        <div className="flex justify-between items-end mb-6">
                            <div>
                                <h2 className="text-lg font-bold text-gray-800">
                                    Search results ({type === 'flight' ? 'Flights' : 'Trains'})
                                </h2>
                                <p className="text-xs text-gray-400 mt-1 font-medium">
                                    Route: {origin} → {destination} • Date: {new Date(departureDate).toLocaleDateString('en-GB')} • {total} results
                                </p>
                            </div>

                            {/* 🔥 DROPDOWN SORT (Sắp xếp sống) */}
                            <div className="flex items-center gap-2 text-sm border border-gray-200 rounded-lg bg-white px-3 py-2 relative">
                                <span className="text-gray-500 whitespace-nowrap">Sort by</span>
                                <select
                                    className="font-bold text-gray-800 outline-none bg-transparent appearance-none pr-4 cursor-pointer z-10"
                                    value={sort}
                                    onChange={(e) => updateURL({ sort: e.target.value, page: 1 })}
                                >
                                    <option value="price:asc">Lowest price</option>
                                    <option value="price:desc">Highest price</option>
                                    <option value="departure_time:asc">Earliest departure</option>
                                </select>
                                <ChevronRight size={14} className="rotate-90 text-gray-400 absolute right-2 pointer-events-none" />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                                <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
                                <p className="text-gray-500 font-bold">Searching for best routes...</p>
                            </div>
                        ) : error ? (
                            <div className="text-center py-20 bg-white rounded-2xl border border-red-100">
                                <AlertCircle className="mx-auto mb-3 text-red-400" size={48} />
                                <h3 className="text-lg font-bold text-gray-800 mb-1">{error}</h3>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {results.map((trip: any) => (
                                    <div key={trip._id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col lg:flex-row justify-between items-center gap-6 hover:border-blue-400 hover:shadow-md transition-all">

                                        {/* Hãng / Code */}
                                        <div className="flex items-center gap-4 w-full lg:w-56 shrink-0">
                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center font-black text-gray-600 text-xs border border-gray-100">
                                                {type === 'flight' ? trip.airline_id?.iata_code : (trip.train_id?.train_number?.substring(0, 3) || 'SE1')}
                                            </div>
                                            <div>
                                                <div className="font-black text-gray-800 text-sm leading-tight">
                                                    {type === 'flight' ? trip.airline_id?.name : trip.train_id?.train_number}
                                                </div>
                                                <div className="text-[10px] text-gray-500 font-medium mt-1">
                                                    {type === 'flight' ? `${trip.flight_number} • Economy` : (trip.train_id?.name || 'Reunification Express')}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Giờ giấc & Điểm dừng */}
                                        <div className="flex items-center gap-4 flex-1 justify-center w-full">
                                            <div className="text-center w-16">
                                                <div className="font-black text-gray-900 text-lg">{new Date(trip.departure_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                                                <div className="text-[10px] font-bold text-gray-400 mt-1">{origin}</div>
                                            </div>

                                            <div className="flex-1 max-w-[120px] mx-4 relative">
                                                <div className="w-full border-t border-gray-300"></div>
                                            </div>

                                            <div className="text-center w-16">
                                                <div className="font-black text-gray-900 text-lg">{new Date(trip.arrival_time).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                                                <div className="text-[10px] font-bold text-gray-400 mt-1">{destination}</div>
                                            </div>

                                            <div className="hidden md:flex flex-col gap-1.5 ml-4">
                                                <div className="flex gap-2">
                                                    <span className="px-3 py-1 border border-gray-200 rounded-full text-[10px] font-bold text-gray-600">Direct</span>
                                                    <span className="px-3 py-1 border border-gray-200 rounded-full text-[10px] font-bold text-gray-600">
                                                        {type === 'flight' ? '2h 15m' : '13h 30m'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-center">
                                                    <span className="px-3 py-1 border border-gray-200 rounded-full text-[10px] font-bold text-gray-600 w-fit">
                                                        {type === 'flight' ? 'Carry-on' : 'Soft seat'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Giá & Nút */}
                                        <div className="w-full lg:w-40 shrink-0 text-center lg:text-right flex flex-col items-center lg:items-end">
                                            <div className="font-black text-xl text-gray-900 mb-1">
                                                {new Intl.NumberFormat('vi-VN').format(trip.prices?.economy || trip.starting_price || 0)}đ
                                            </div>
                                            <div className="text-[10px] font-bold text-gray-400 mb-3">from / pax</div>
                                            <Link
                                                href={type === 'flight' ? `/flights/${trip._id}` : `/train-trips/${trip._id}`}
                                                className="w-full lg:w-auto bg-blue-600 text-white px-8 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm"
                                            >
                                                Chọn
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Phân trang */}
                        {total > 0 && (
                            <div className="flex justify-center items-center gap-4 mt-12 pb-8">
                                <button disabled={page <= 1} onClick={() => updateURL({ page: page - 1 })} className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:border-blue-500 transition-all bg-white"><ChevronLeft size={20} /></button>
                                <button disabled={results.length < 10} onClick={() => updateURL({ page: page + 1 })} className="p-2 rounded-lg border border-gray-200 disabled:opacity-30 hover:border-blue-500 transition-all bg-white"><ChevronRight size={20} /></button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="flex justify-center h-screen items-center"><Loader2 className="animate-spin text-blue-600" /></div>}>
            <SearchResults />
        </Suspense>
    );
}