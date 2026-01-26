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
    const relevantGuests = guests.filter(g => g.asoebi || g.asoebiPaid);

    return relevantGuests.map(guest => {
      // Parse Type and Quantity from asoebiSelection
      // Expected format example: "Bride's Family - Men x2"
      // Or potentially multiple: "Bride's Family - Men x2, Groom's Family - Women x1"
      
      let type = 'Unknown';
      let quantity = 0;
      let selectionRaw = guest.asoebiSelection || '';

      // Simple parsing strategy:
      // If we can find "x" followed by number, extract it.
      // Type is the rest of the string.
      
      if (selectionRaw) {
        // Check if there are multiple selections (comma separated)
        // For simplicity, we might just display the raw string if complex, 
        // but let's try to make it look good as requested "Type" and "Quantity".
        
        // If single selection:
        const match = selectionRaw.match(/(.*?)\s*x\s*(\d+)/i);
        if (match) {
          type = match[1].trim();
          quantity = parseInt(match[2], 10);
        } else {
          type = selectionRaw;
          quantity = 1; // Default to 1 if not specified but selection exists
        }
      }

      // Determine Amount Paid
      // Look for a contribution from this guest for the same event
      // This is heuristic as email is optional for guest but required for contribution usually?
      // Guest email might be null if added manually without email.
      // But for Asoebi purchase, they likely entered email in payment flow.
      
      let amountPaid = 0;
      if (guest.email && guest.asoebiPaid) {
        // Find contributions by email and giftId
        const contribs = contributions.filter(
          c => c.giftId === guest.giftId && 
               c.contributorEmail?.toLowerCase() === guest.email?.toLowerCase()
        );
        
        // Sum amounts (in case of multiple payments, though unlikely for single asoebi)
        // Note: Contribution amount is in main currency unit (Naira) based on backend.
        amountPaid = contribs.reduce((sum, c) => sum + c.amount, 0);
      }

      // Status
      const status = guest.asoebiPaid ? 'Paid' : 'Pending';

      return {
        id: guest.id,
        name: `${guest.firstName} ${guest.lastName}`,
        email: guest.email || '-',
        type,
        quantity,
        amountPaid,
        status,
        selectionRaw // Keep raw for tooltip or fallback
      };
    });
  }, [guests, contributions]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Asoebi Tracker</CardTitle>
      </CardHeader>
      <CardContent>
        {asoebiData.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No Asoebi data found.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Type (Bride / Groom)</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {asoebiData.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>
                    {row.type}
                    {/* If raw selection is complex and parsing failed to capture all, maybe show info icon? */}
                  </TableCell>
                  <TableCell>{row.quantity > 0 ? row.quantity : '-'}</TableCell>
                  <TableCell>
                    {row.amountPaid > 0 
                      ? `₦${row.amountPaid.toLocaleString()}` 
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={row.status === 'Paid' ? 'default' : 'secondary'} 
                           className={row.status === 'Paid' ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'}>
                      {row.status}
                    </Badge>
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
