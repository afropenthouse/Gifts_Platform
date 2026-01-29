import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { FileDown } from 'lucide-react';

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  asoebi?: boolean;
  asoebiPaid?: boolean;
  asoebiSelection?: string;
  giftId?: number;
}

interface Contribution {
  id: number;
  giftId: number;
  contributorEmail: string;
  amount: number;
  isAsoebi?: boolean; // Note: schema doesn't have isAsoebi on Contribution, but metadata might. 
                      // However, we can match by email and giftId for now.
  message?: string;
}

interface Gift {
  id: number;
  title: string;
  isSellingAsoebi?: boolean;
  asoebiPrice?: number | string;
  asoebiPriceMen?: number | string;
  asoebiPriceWomen?: number | string;
  asoebiBrideMenPrice?: number | string;
  asoebiBrideWomenPrice?: number | string;
  asoebiGroomMenPrice?: number | string;
  asoebiGroomWomenPrice?: number | string;
  asoebiQuantity?: number;
  asoebiQtyMen?: number;
  asoebiQtyWomen?: number;
  asoebiBrideMenQty?: number;
  asoebiBrideWomenQty?: number;
  asoebiGroomMenQty?: number;
  asoebiGroomWomenQty?: number;
  soldAsoebiQuantity?: number;
  soldAsoebiQtyMen?: number;
  soldAsoebiQtyWomen?: number;
  soldAsoebiBrideMenQty?: number;
  soldAsoebiBrideWomenQty?: number;
  soldAsoebiGroomMenQty?: number;
  soldAsoebiGroomWomenQty?: number;
}

interface AsoebiProps {
  guests: Guest[];
  contributions: Contribution[];
  gifts: Gift[];
}

const Asoebi: React.FC<AsoebiProps> = ({ guests, contributions, gifts }) => {
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'bride' | 'groom'>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'delivered' | 'undelivered'>('all');
  const [qtyFilter, setQtyFilter] = useState<'all' | 'male_has' | 'male_none' | 'female_has' | 'female_none'>('all');
  const [deliveryStatus, setDeliveryStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const saved = localStorage.getItem('asoebiDeliveryStatus');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          setDeliveryStatus(parsed);
        }
      } catch {}
    }
  }, []);

  const persistDeliveryStatus = (updated: Record<string, boolean>) => {
    setDeliveryStatus(updated);
    try {
      localStorage.setItem('asoebiDeliveryStatus', JSON.stringify(updated));
    } catch {}
  };

  const asoebiData = useMemo(() => {
    // Filter guests who clicked Get Asoebi or purchased Asoebi
    let relevantGuests = guests.filter(g => g.asoebiPaid);

    if (eventFilter !== 'all') {
      relevantGuests = relevantGuests.filter(g => g.giftId === parseInt(eventFilter));
    }

    const processedData = relevantGuests.map(guest => {
      // Get the gift title for this guest
      const gift = gifts.find(g => g.id === guest.giftId);
      const eventTitle = gift ? gift.title : 'Unknown Event';
      // Expected format example: "Bride's Family - Men x2"
      // Or potentially multiple: "Bride's Family - Men x2, Groom's Family - Women x1"
      
      let type = '-';
      let maleQty = '-';
      let femaleQty = '-';
      let selectionRaw = guest.asoebiSelection || '';

      if (selectionRaw) {
        // Determine Type
        if (selectionRaw.toLowerCase().includes("bride")) {
          type = "Bride";
        } else if (selectionRaw.toLowerCase().includes("groom")) {
          type = "Groom";
        }

        // Determine Quantities
        const menMatch = selectionRaw.match(/Men x(\d+)/i);
        if (menMatch) {
          maleQty = menMatch[1];
        }

        const womenMatch = selectionRaw.match(/Women x(\d+)/i);
        if (womenMatch) {
          femaleQty = womenMatch[1];
        }
      }

      // Determine Amount Paid
      // Look for a contribution from this guest for the same event
      let amountPaid = 0;
      if (guest.email && guest.asoebiPaid) {
        // Find contributions by email and giftId
        const contribs = contributions.filter(
          c => c.giftId === guest.giftId && 
               c.contributorEmail?.toLowerCase() === guest.email?.toLowerCase()
        );
        
        // Sum amounts
        amountPaid = contribs.reduce((sum, c) => sum + c.amount, 0);
      }

      // Status
      const status = guest.asoebiPaid ? 'Paid' : 'Pending';

      const key = `${guest.giftId}:${guest.id}`;
      const delivered = Boolean(deliveryStatus[key]);

      return {
        id: guest.id,
        name: `${guest.firstName} ${guest.lastName}`,
        email: guest.email || '-',
        type,
        maleQty,
        femaleQty,
        amountPaid,
        status,
        selectionRaw,
        giftId: guest.giftId,
        eventTitle,
        delivered
      };
    });

    let filtered = processedData.filter(item => item.status === 'Paid');

    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type.toLowerCase() === typeFilter);
    }

    if (deliveryFilter !== 'all') {
      filtered = filtered.filter(item =>
        deliveryFilter === 'delivered' ? item.delivered : !item.delivered
      );
    }
    if (qtyFilter !== 'all') {
      filtered = filtered.filter(item => {
        const male = parseInt(String(item.maleQty));
        const female = parseInt(String(item.femaleQty));
        const maleHas = Number.isFinite(male) && male > 0;
        const femaleHas = Number.isFinite(female) && female > 0;
        if (qtyFilter === 'male_has') return maleHas;
        if (qtyFilter === 'male_none') return !maleHas;
        if (qtyFilter === 'female_has') return femaleHas;
        if (qtyFilter === 'female_none') return !femaleHas;
        return true;
      });
    }

    return filtered;
  }, [guests, contributions, eventFilter, typeFilter, deliveryFilter, qtyFilter, deliveryStatus, gifts]);

  const selectedGift = useMemo(() => {
    if (eventFilter === 'all') return null;
    const gid = parseInt(eventFilter);
    return gifts.find(g => g.id === gid) || null;
  }, [eventFilter, gifts]);

  const getStock = (total?: number, sold?: number) => {
    if (total === undefined || total === null) return undefined;
    const s = sold || 0;
    return Math.max(0, total - s);
  };

  const stockSummary = useMemo(() => {
    const toNum = (v?: number | string) => {
      if (v === undefined || v === null) return 0;
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    const calcGiftStock = (g: Gift) => ({
      brideMen: Math.max(0, toNum(g.asoebiBrideMenQty) - toNum(g.soldAsoebiBrideMenQty)),
      brideWomen: Math.max(0, toNum(g.asoebiBrideWomenQty) - toNum(g.soldAsoebiBrideWomenQty)),
      groomMen: Math.max(0, toNum(g.asoebiGroomMenQty) - toNum(g.soldAsoebiGroomMenQty)),
      groomWomen: Math.max(0, toNum(g.asoebiGroomWomenQty) - toNum(g.soldAsoebiGroomWomenQty)),
      men: Math.max(0, toNum(g.asoebiQtyMen) - toNum(g.soldAsoebiQtyMen)),
      women: Math.max(0, toNum(g.asoebiQtyWomen) - toNum(g.soldAsoebiQtyWomen)),
      generic: Math.max(0, toNum(g.asoebiQuantity) - toNum(g.soldAsoebiQuantity)),
      hasSelling: Boolean(g.isSellingAsoebi)
    });
    if (selectedGift) {
      const s = calcGiftStock(selectedGift);
      const hasAny =
        s.hasSelling ||
        s.brideMen + s.brideWomen + s.groomMen + s.groomWomen + s.men + s.women + s.generic > 0;
      return { ...s, show: hasAny };
    }
    // Aggregate across all gifts when "All Events"
    let total = {
      brideMen: 0, brideWomen: 0, groomMen: 0, groomWomen: 0, men: 0, women: 0, generic: 0
    };
    let anySelling = false;
    for (const g of gifts) {
      const s = calcGiftStock(g);
      total.brideMen += s.brideMen;
      total.brideWomen += s.brideWomen;
      total.groomMen += s.groomMen;
      total.groomWomen += s.groomWomen;
      total.men += s.men;
      total.women += s.women;
      total.generic += s.generic;
      anySelling = anySelling || s.hasSelling;
    }
    const hasAny = anySelling || (total.brideMen + total.brideWomen + total.groomMen + total.groomWomen + total.men + total.women + total.generic > 0);
    return { ...total, show: hasAny };
  }, [selectedGift, gifts]);

  const exportCSV = () => {
    const headers = [
      'Name',
      'Email',
      'Event',
      'Type',
      'Men Qty',
      'Women Qty',
      'Amount Paid',
      'Delivered'
    ];
    const rows = asoebiData.map(r => [
      r.name,
      r.email,
      r.eventTitle,
      r.type,
      r.maleQty,
      r.femaleQty,
      r.amountPaid,
      r.delivered ? 'Yes' : 'No'
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'asoebi-orders.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="event-filter-top">Event:</Label>
          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-[160px] sm:w-[200px]" id="event-filter-top">
              <SelectValue placeholder="Select event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              {gifts.map(g => (
                <SelectItem key={g.id} value={String(g.id)}>{g.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {stockSummary.show && (
        <>
          <div className="text-sm font-semibold text-gray-900 mb-2">In Stock</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary text-white text-center">
              <div className="text-sm/5 opacity-90">Bride's Asoebi (Men)</div>
              <div className="text-2xl font-semibold text-center">{stockSummary.brideMen}</div>
            </div>
            <div className="p-3 rounded-lg bg-primary text-white text-center">
              <div className="text-sm/5 opacity-90">Bride's Asoebi (Women)</div>
              <div className="text-2xl font-semibold text-center">{stockSummary.brideWomen}</div>
            </div>
            <div className="p-3 rounded-lg bg-primary text-white text-center">
              <div className="text-sm/5 opacity-90">Groom's Asoebi (Men)</div>
              <div className="text-2xl font-semibold text-center">{stockSummary.groomMen}</div>
            </div>
            <div className="p-3 rounded-lg bg-primary text-white text-center">
              <div className="text-sm/5 opacity-90">Groom's Asoebi (Women)</div>
              <div className="text-2xl font-semibold text-center">{stockSummary.groomWomen}</div>
            </div>
          </div>
        </>
      )}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Asoebi Orders</CardTitle>
          <div className="flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center gap-4 mt-4">
            <div className="grid grid-cols-[70px_1fr] items-center gap-2 md:flex md:gap-2">
              <Label htmlFor="type-filter" className="md:text-left">Type:</Label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="w-full md:w-[160px]" id="type-filter">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="bride">Bride</SelectItem>
                  <SelectItem value="groom">Groom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-[70px_1fr] items-center gap-2 md:flex md:gap-2">
              <Label htmlFor="qty-filter" className="md:text-left">Qty:</Label>
              <Select value={qtyFilter} onValueChange={(v) => setQtyFilter(v as any)}>
                <SelectTrigger className="w-full md:w-[170px]" id="qty-filter">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="male_has">Men: Has</SelectItem>
                  <SelectItem value="male_none">Men: None</SelectItem>
                  <SelectItem value="female_has">Women: Has</SelectItem>
                  <SelectItem value="female_none">Women: None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-[70px_1fr] items-center gap-2 md:flex md:gap-2">
              <Label htmlFor="delivery-filter" className="md:text-left">Delivery:</Label>
              <Select value={deliveryFilter} onValueChange={(v) => setDeliveryFilter(v as any)}>
                <SelectTrigger className="w-full md:w-[180px]" id="delivery-filter">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="undelivered">Undelivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center pt-2 md:pt-0">
              <Button className="w-full md:w-auto bg-[#2E235C] text-white hover:bg-[#2E235C]/90" size="sm" onClick={exportCSV}>
                <FileDown className="w-4 h-4 mr-2" />
                Download CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {asoebiData.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No Asoebi records found.
          </div>
          ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type (Bride / Groom)</TableHead>
                  <TableHead>Men Quantity</TableHead>
                  <TableHead>Women Quantity</TableHead>
                  <TableHead>Amount Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asoebiData.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.type}</TableCell>
                    <TableCell>{row.maleQty}</TableCell>
                    <TableCell>{row.femaleQty}</TableCell>
                    <TableCell>
                      {row.amountPaid > 0 
                        ? `₦${row.amountPaid.toLocaleString()}` 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        row.status === 'Paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={row.delivered}
                        onCheckedChange={(checked) => {
                          const key = `${row.giftId}:${row.id}`;
                          const updated = { ...deliveryStatus, [key]: Boolean(checked) };
                          persistDeliveryStatus(updated);
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default Asoebi;
