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
  contributorName?: string;
  amount: number;
  isAsoebi?: boolean;
  message?: string;
  status?: string;
  asoebiQuantity?: number;
  asoebiQtyMen?: number;
  asoebiQtyWomen?: number;
  asoebiBrideMenQty?: number;
  asoebiBrideWomenQty?: number;
  asoebiGroomMenQty?: number;
  asoebiGroomWomenQty?: number;
  createdAt?: string;
}

interface Gift {
  id: number;
  title: string;
  type?: string;
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
  const [qtyFilter, setQtyFilter] = useState<'all' | 'men' | 'women'>('all');
  const [deliveryStatus, setDeliveryStatus] = useState<Record<string, boolean>>({});
  const [stockView, setStockView] = useState<'in_stock' | 'sold_out'>('in_stock');

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
    // Filter contributions that are for Asoebi
    let relevantContribs = contributions.filter(c => c.isAsoebi);

    if (eventFilter !== 'all') {
      const gid = parseInt(eventFilter);
      relevantContribs = relevantContribs.filter(c => c.giftId === gid);
    }

    const processedData = relevantContribs.map(c => {
      // Get the gift title
      const gift = gifts.find(g => g.id === c.giftId);
      const eventTitle = gift ? gift.title : 'Unknown Event';

      // Helper to sum
      const sum = (...args: (number | undefined)[]) => args.reduce((a, b) => (a || 0) + (b || 0), 0) || 0;

      // Determine Quantities
      const brideMen = c.asoebiBrideMenQty || 0;
      const brideWomen = c.asoebiBrideWomenQty || 0;
      const groomMen = c.asoebiGroomMenQty || 0;
      const groomWomen = c.asoebiGroomWomenQty || 0;
      const men = c.asoebiQtyMen || 0;
      const women = c.asoebiQtyWomen || 0;

      const totalMen = sum(brideMen, groomMen, men);
      const totalWomen = sum(brideWomen, groomWomen, women);

      // Determine Type
      let type = '-';
      const hasBride = brideMen > 0 || brideWomen > 0;
      const hasGroom = groomMen > 0 || groomWomen > 0;

      if (hasBride && hasGroom) {
        type = 'Bride & Groom';
      } else if (hasBride) {
        type = 'Bride';
      } else if (hasGroom) {
        type = 'Groom';
      }

      // Fallback for legacy data (Type)
      if (type === '-' && c.isAsoebi) {
        const msg = (c.message || '').toLowerCase();
        if (msg.includes('bride') && msg.includes('groom')) type = 'Bride & Groom';
        else if (msg.includes('bride')) type = 'Bride';
        else if (msg.includes('groom')) type = 'Groom';
      }

      // Fallback for legacy data (Quantities)
      if (totalMen === 0 && totalWomen === 0 && (c.asoebiQuantity || 0) > 0) {
        // If we can't distinguish, we'll try to infer from message, otherwise default to women (common case) or just show as generic
        // However, the table only has Men/Women columns.
        // We will default to Women column if unspecified, as it's more common for Asoebi to be female-dominated,
        // unless message says "Men".
        const msg = (c.message || '').toLowerCase();
        if (msg.includes('men') && !msg.includes('women')) {
           // It's likely men
           // But we need to be careful not to double count if logic changes.
           // Since totalMen is 0, we can safely assign.
           // We won't modify totalMen variable but just use it in the return object logic
           // Actually, let's just override totalMen/totalWomen for the display logic below
        }
      }

      // Final display values with fallback
      let displayMen = totalMen;
      let displayWomen = totalWomen;
      
      if (displayMen === 0 && displayWomen === 0 && (c.asoebiQuantity || 0) > 0) {
         const msg = (c.message || '').toLowerCase();
         if (msg.includes('men') && !msg.includes('women')) {
            displayMen = c.asoebiQuantity || 0;
         } else {
            // Default to women if we can't tell, or if it says women
            displayWomen = c.asoebiQuantity || 0;
         }
      }

      // Status
      const status = c.status === 'completed' ? 'Paid' : (c.status || 'Paid');

      // Delivery Key: Use contribution ID
      const key = `${c.giftId}:contrib-${c.id}`;
      const delivered = Boolean(deliveryStatus[key]);

      // Name fallback
      const name = c.contributorName || c.contributorEmail || 'Anonymous';

      return {
        id: c.id,
        name,
        email: c.contributorEmail || '-',
        type,
        maleQty: displayMen > 0 ? displayMen : '-',
        femaleQty: displayWomen > 0 ? displayWomen : '-',
        amountPaid: c.amount,
        status,
        giftId: c.giftId,
        eventTitle,
        delivered
      };
    });

    let filtered = processedData;

    if (typeFilter !== 'all') {
      if (typeFilter === 'bride') filtered = filtered.filter(item => item.type.includes('Bride'));
      if (typeFilter === 'groom') filtered = filtered.filter(item => item.type.includes('Groom'));
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
        if (qtyFilter === 'men') return maleHas;
        if (qtyFilter === 'women') return femaleHas;
        return true;
      });
    }
    
    // Sort by ID desc (newest first)
    filtered.sort((a, b) => b.id - a.id);

    return filtered;
  }, [contributions, gifts, eventFilter, typeFilter, deliveryFilter, qtyFilter, deliveryStatus]);

  const selectedGift = useMemo(() => {
    if (eventFilter === 'all') return null;
    const gid = parseInt(eventFilter);
    return gifts.find(g => g.id === gid) || null;
  }, [eventFilter, gifts]);

  const showTypeColumn = useMemo(() => {
    if (selectedGift) {
      return selectedGift.type === 'wedding';
    }
    // If viewing all, show if at least one wedding event exists in the filtered data
    return gifts.some(g => g.type === 'wedding');
  }, [selectedGift, gifts]);

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
    const calcGiftStock = (g: Gift) => {
      const soldBM = toNum(g.soldAsoebiBrideMenQty);
      const soldBW = toNum(g.soldAsoebiBrideWomenQty);
      const soldGM = toNum(g.soldAsoebiGroomMenQty);
      const soldGW = toNum(g.soldAsoebiGroomWomenQty);
      const soldM = toNum(g.soldAsoebiQtyMen);
      const soldW = toNum(g.soldAsoebiQtyWomen);
      const soldGen = toNum(g.soldAsoebiQuantity);

      return {
        inStock: {
          brideMen: Math.max(0, toNum(g.asoebiBrideMenQty) - soldBM),
          brideWomen: Math.max(0, toNum(g.asoebiBrideWomenQty) - soldBW),
          groomMen: Math.max(0, toNum(g.asoebiGroomMenQty) - soldGM),
          groomWomen: Math.max(0, toNum(g.asoebiGroomWomenQty) - soldGW),
          men: Math.max(0, toNum(g.asoebiQtyMen) - soldM),
          women: Math.max(0, toNum(g.asoebiQtyWomen) - soldW),
          generic: Math.max(0, toNum(g.asoebiQuantity) - soldGen),
        },
        soldOut: {
          brideMen: soldBM,
          brideWomen: soldBW,
          groomMen: soldGM,
          groomWomen: soldGW,
          men: soldM,
          women: soldW,
          generic: soldGen,
        },
        hasSelling: Boolean(g.isSellingAsoebi)
      };
    };

    if (selectedGift) {
      const s = calcGiftStock(selectedGift);
      const hasAny =
        s.hasSelling ||
        Object.values(s.inStock).reduce((a, b) => a + b, 0) > 0 ||
        Object.values(s.soldOut).reduce((a, b) => a + b, 0) > 0;
      return { ...s, show: hasAny };
    }
    // Aggregate across all gifts when "All Events"
    let total = {
      inStock: { brideMen: 0, brideWomen: 0, groomMen: 0, groomWomen: 0, men: 0, women: 0, generic: 0 },
      soldOut: { brideMen: 0, brideWomen: 0, groomMen: 0, groomWomen: 0, men: 0, women: 0, generic: 0 }
    };
    let anySelling = false;
    for (const g of gifts) {
      const s = calcGiftStock(g);
      total.inStock.brideMen += s.inStock.brideMen;
      total.inStock.brideWomen += s.inStock.brideWomen;
      total.inStock.groomMen += s.inStock.groomMen;
      total.inStock.groomWomen += s.inStock.groomWomen;
      total.inStock.men += s.inStock.men;
      total.inStock.women += s.inStock.women;
      total.inStock.generic += s.inStock.generic;

      total.soldOut.brideMen += s.soldOut.brideMen;
      total.soldOut.brideWomen += s.soldOut.brideWomen;
      total.soldOut.groomMen += s.soldOut.groomMen;
      total.soldOut.groomWomen += s.soldOut.groomWomen;
      total.soldOut.men += s.soldOut.men;
      total.soldOut.women += s.soldOut.women;
      total.soldOut.generic += s.soldOut.generic;

      anySelling = anySelling || s.hasSelling;
    }
    const hasAny = anySelling || 
      Object.values(total.inStock).reduce((a, b) => a + b, 0) > 0 ||
      Object.values(total.soldOut).reduce((a, b) => a + b, 0) > 0;
    return { ...total, show: hasAny };
  }, [selectedGift, gifts]);

  const exportCSV = () => {
    const headers = [
      'Name',
      'Email',
      'Event',
      ...(showTypeColumn ? ['Asoebi Type'] : []),
      'Men Qty',
      'Women Qty',
      'Amount Paid',
      'Delivered'
    ];
    const rows = asoebiData.map(r => [
      r.name,
      r.email,
      r.eventTitle,
      ...(showTypeColumn ? [r.type] : []),
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
          <div className="mb-2">
            <Select value={stockView} onValueChange={(v) => setStockView(v as 'in_stock' | 'sold_out')}>
              <SelectTrigger className="w-[140px] h-8 text-sm font-semibold border-none shadow-none p-0 focus:ring-0 focus:ring-offset-0 bg-transparent text-gray-900 justify-start gap-2 [&>svg]:opacity-50 hover:bg-transparent data-[state=open]:bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="sold_out">Sold Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary text-white text-center">
              <div className="text-sm/5 opacity-90">Bride's Asoebi (Men)</div>
              <div className="text-2xl font-semibold text-center">
                {stockView === 'in_stock' ? stockSummary.inStock.brideMen : stockSummary.soldOut.brideMen}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary text-white text-center">
              <div className="text-sm/5 opacity-90">Bride's Asoebi (Women)</div>
              <div className="text-2xl font-semibold text-center">
                {stockView === 'in_stock' ? stockSummary.inStock.brideWomen : stockSummary.soldOut.brideWomen}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary text-white text-center">
              <div className="text-sm/5 opacity-90">Groom's Asoebi (Men)</div>
              <div className="text-2xl font-semibold text-center">
                {stockView === 'in_stock' ? stockSummary.inStock.groomMen : stockSummary.soldOut.groomMen}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary text-white text-center">
              <div className="text-sm/5 opacity-90">Groom's Asoebi (Women)</div>
              <div className="text-2xl font-semibold text-center">
                {stockView === 'in_stock' ? stockSummary.inStock.groomWomen : stockSummary.soldOut.groomWomen}
              </div>
            </div>
          </div>
        </>
      )}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Asoebi Orders</CardTitle>
          <div className="grid grid-cols-3 gap-2 mt-2 md:flex md:flex-wrap md:items-center">
            {showTypeColumn && (
            <div className="flex items-center gap-1">
              <Label htmlFor="type-filter" className="hidden md:inline md:text-left">Type:</Label>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                <SelectTrigger className="w-full md:w-[160px]" id="type-filter">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="hidden md:inline">All</span>
                    <span className="inline md:hidden">Type</span>
                  </SelectItem>
                  <SelectItem value="bride">Bride</SelectItem>
                  <SelectItem value="groom">Groom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            )}
            <div className="flex items-center gap-1">
              <Label htmlFor="qty-filter" className="hidden md:inline md:text-left">Qty:</Label>
              <Select value={qtyFilter} onValueChange={(v) => setQtyFilter(v as any)}>
                <SelectTrigger className="w-full md:w-[170px]" id="qty-filter">
                  <SelectValue placeholder="Qty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="hidden md:inline">All</span>
                    <span className="inline md:hidden">Qty</span>
                  </SelectItem>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Label htmlFor="delivery-filter" className="hidden md:inline md:text-left">Delivery:</Label>
              <Select value={deliveryFilter} onValueChange={(v) => setDeliveryFilter(v as any)}>
                <SelectTrigger className="w-full md:w-[180px]" id="delivery-filter">
                  <SelectValue placeholder="Delivery" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="hidden md:inline">All</span>
                    <span className="inline md:hidden">Delivery</span>
                  </SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="undelivered">Undelivered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center pt-2 md:pt-0">
              <Button className="w-auto bg-[#2E235C] text-white hover:bg-[#2E235C]/90 px-2" size="sm" onClick={exportCSV}>
                <FileDown className="w-4 h-4 mr-1" />
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
                  {showTypeColumn && <TableHead>Asoebi Type</TableHead>}
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
                    {showTypeColumn && <TableCell>{row.type}</TableCell>}
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
                          const key = `${row.giftId}:contrib-${row.id}`;
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
