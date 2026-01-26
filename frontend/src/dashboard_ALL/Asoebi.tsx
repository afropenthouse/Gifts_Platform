import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';

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
}

interface AsoebiProps {
  guests: Guest[];
  contributions: Contribution[];
  gifts: Gift[];
}

const Asoebi: React.FC<AsoebiProps> = ({ guests, contributions, gifts }) => {
  
  const asoebiData = useMemo(() => {
    // Filter guests who clicked Get Asoebi or purchased Asoebi
    const relevantGuests = guests.filter(g => g.asoebiPaid);

    const processedData = relevantGuests.map(guest => {
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

      return {
        id: guest.id,
        name: `${guest.firstName} ${guest.lastName}`,
        email: guest.email || '-',
        type,
        maleQty,
        femaleQty,
        amountPaid,
        status,
        selectionRaw
      };
    });

    // Only show paid status as requested
    return processedData.filter(item => item.status === 'Paid');
  }, [guests, contributions]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Asoebi Orders</CardTitle>
      </CardHeader>
      <CardContent>
        {asoebiData.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No Asoebi records found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type (Bride / Groom)</TableHead>
                <TableHead>Male Quantity</TableHead>
                <TableHead>Female Quantity</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Status</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default Asoebi;
