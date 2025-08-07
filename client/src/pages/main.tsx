import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Order, EntryStatus } from "@shared/schema";
import { OrderTable } from "@/components/order-table";
import { OrderDetails } from "@/components/order-details";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function MainPage() {
  const [, setLocation] = useLocation();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState({
    sno: "",
    product: "",
    status: "all",
    date: "all",
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const { data: entryStatuses = [] } = useQuery<EntryStatus[]>({
    queryKey: ["/api/entry-status"],
  });

  // Initialize filtered orders when orders data loads
  useEffect(() => {
    if (orders) {
      setFilteredOrders(orders);
    }
  }, [orders]);

  // Function to apply filters manually
  const applyCurrentFilters = () => {
    if (!orders || orders.length === 0) return;
    
    let filtered = [...orders];

    // S No filter
    if (filters.sno && filters.sno.trim()) {
      filtered = filtered.filter(order => order.sno.includes(filters.sno.trim()));
    }

    // Product filter
    if (filters.product && filters.product.trim()) {
      filtered = filtered.filter(order => 
        order.product.toLowerCase().includes(filters.product.trim().toLowerCase())
      );
    }

    // Status filter
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(order => order.deliveryStatus === filters.status);
    }

    // Date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filters.date && filters.date !== "all" && !['asc', 'desc'].includes(filters.date)) {
      filtered = filtered.filter(order => {
        if (!order.dDate) return false;
        const dDate = new Date(order.dDate);
        if (isNaN(dDate.getTime())) return false;

        switch (filters.date) {
          case "today":
            return dDate.toDateString() === today.toDateString();
          case "tomorrow":
            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);
            return dDate.toDateString() === tomorrow.toDateString();
          case "thisweek":
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return dDate >= weekStart && dDate <= weekEnd;
          case "thismonth":
            return dDate.getMonth() === today.getMonth() && dDate.getFullYear() === today.getFullYear();
          default:
            return true;
        }
      });
    }

    // Date sorting
    if (filters.date === "asc") {
      filtered.sort((a, b) => new Date(a.dDate).getTime() - new Date(b.dDate).getTime());
    } else if (filters.date === "desc") {
      filtered.sort((a, b) => new Date(b.dDate).getTime() - new Date(a.dDate).getTime());
    }

    setFilteredOrders(filtered);
  };

  const handleShowDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleEditOrder = (order: Order) => {
    setLocation(`/orders?edit=${order.sno}`);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
  };

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading data, please wait...</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-navy-dark mb-6">Orders List</h2>
      
      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="flex flex-col">
          <Label className="text-sm font-medium text-navy-light mb-1">Search S No</Label>
          <Input
            placeholder="S No"
            value={filters.sno}
            onChange={(e) => setFilters(prev => ({ ...prev, sno: e.target.value }))}
            className="min-w-32"
          />
        </div>
        
        <div className="flex flex-col">
          <Label className="text-sm font-medium text-navy-light mb-1">Product</Label>
          <Input
            placeholder="Type product"
            value={filters.product}
            onChange={(e) => setFilters(prev => ({ ...prev, product: e.target.value }))}
            className="min-w-32"
          />
        </div>
        
        <div className="flex flex-col">
          <Label className="text-sm font-medium text-navy-light mb-1">Status</Label>
          <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger className="min-w-32">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col">
          <Label className="text-sm font-medium text-navy-light mb-1">Date</Label>
          <Select value={filters.date} onValueChange={(value) => setFilters(prev => ({ ...prev, date: value }))}>
            <SelectTrigger className="min-w-32">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="tomorrow">Tomorrow</SelectItem>
              <SelectItem value="thisweek">Current Week</SelectItem>
              <SelectItem value="thismonth">Current Month</SelectItem>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          className="btn-action mt-6"
          onClick={applyCurrentFilters}
        >
          Apply Filter
        </Button>
      </div>

      {/* Order Details */}
      {selectedOrder && (
        <OrderDetails
          order={selectedOrder}
          entryStatuses={entryStatuses}
          onClose={handleCloseDetails}
          onEdit={handleEditOrder}
        />
      )}

      {/* Orders Table */}
      <OrderTable
        orders={filteredOrders}
        entryStatuses={entryStatuses}
        onShowDetails={handleShowDetails}
        onEditOrder={handleEditOrder}
      />
    </div>
  );
}
