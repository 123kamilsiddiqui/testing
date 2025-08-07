import { Order, EntryStatus } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { X, Download } from "lucide-react";

interface OrderDetailsProps {
  order: Order;
  entryStatuses: EntryStatus[];
  onClose: () => void;
  onEdit: (order: Order) => void;
}

export function OrderDetails({ order, entryStatuses, onClose, onEdit }: OrderDetailsProps) {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "delivered":
        return "Delivered ✅";
      case "pending":
        return "Pending ⏳";
      case "canceled":
        return "Canceled ❌";
      default:
        return "N/A";
    }
  };

  const getEntryStatusDisplay = () => {
    const statuses = entryStatuses.filter(es => es.sno === order.sno);
    return statuses.length > 0
      ? statuses.map(es => `${es.product} ${es.package ? "✅" : "❌"}`).join(" | ")
      : "None";
  };

  return (
    <div className="details-section">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-navy-dark">Order Details</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <p><strong className="text-navy-light">S No:</strong> <span>{order.sno}</span></p>
        <p><strong className="text-navy-light">Product:</strong> <span>{order.product}</span></p>
        <p><strong className="text-navy-light">Additional:</strong> <span>{order.additional || "N/A"}</span></p>
        <p><strong className="text-navy-light">Order Date:</strong> <span>{order.oDate}</span></p>
        <p><strong className="text-navy-light">Delivery Date:</strong> <span>{order.dDate}</span></p>
        <p><strong className="text-navy-light">Telephone:</strong> <span>{order.tel}</span></p>
        <p><strong className="text-navy-light">Staff:</strong> <span>{order.staffName || "Not assigned"}</span></p>
        <p><strong className="text-navy-light">Entry Statuses:</strong> <span>{getEntryStatusDisplay()}</span></p>
      </div>
      
      <div className="mt-4">
        <p><strong className="text-navy-light">Delivery Status:</strong> 
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
            order.deliveryStatus === 'delivered' ? 'bg-green-100 text-green-800' :
            order.deliveryStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {getStatusLabel(order.deliveryStatus)}
          </span>
        </p>
      </div>

      {order.link && (
        <div className="mt-4">
          <p><strong className="text-navy-light">Image:</strong></p>
          <img
            src={order.link}
            alt="Product Image"
            className="max-w-80 max-h-56 border-2 border-navy-light mt-2 rounded-md bg-white"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
          <br />
          <Button
            variant="outline"
            size="sm"
            className="mt-2"
            asChild
          >
            <a href={order.link} download>
              <Download className="h-4 w-4 mr-2" />
              Download Image
            </a>
          </Button>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        <Button
          onClick={onClose}
          variant="outline"
          className="btn-action"
        >
          Close Details
        </Button>
        <Button
          onClick={() => onEdit(order)}
          className="btn-action"
        >
          Edit Details
        </Button>
      </div>
    </div>
  );
}
