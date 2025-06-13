// src/app/(main)/admin/audit-log/page.tsx

'use client';

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { ListChecks, ShieldAlert, Search, Filter } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockAuditLogs, mockUserProfiles } from '@/lib/data';
import type { AuditLog as AuditLogType } from '@/types';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 15;

interface EnrichedAuditLog extends AuditLogType {
  userName?: string;
}

export default function AuditLogPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (user && !user.isSuperAdmin) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const enrichedLogs: EnrichedAuditLog[] = useMemo(() => {
    return mockAuditLogs.map(log => ({
      ...log,
      userName: log.user_id ? mockUserProfiles.find(u => u.user_id === log.user_id)?.username : 'System',
    })).sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
  }, []);

  const uniqueActionTypes = useMemo(() => {
    const types = new Set(enrichedLogs.map(log => log.action_type));
    return Array.from(types).sort();
  }, [enrichedLogs]);

  const filteredLogs = useMemo(() => {
    return enrichedLogs.filter(log => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        (log.userName && log.userName.toLowerCase().includes(searchLower)) ||
        log.action_type.toLowerCase().includes(searchLower) ||
        (log.target_entity_type && log.target_entity_type.toLowerCase().includes(searchLower)) ||
        (log.target_entity_id && String(log.target_entity_id).toLowerCase().includes(searchLower)) ||
        (log.details && log.details.toLowerCase().includes(searchLower)) ||
        (log.ip_address && log.ip_address.toLowerCase().includes(searchLower));

      const matchesActionType = selectedActionType === 'all' ? true : log.action_type === selectedActionType;
      
      return matchesSearch && matchesActionType;
    });
  }, [enrichedLogs, searchTerm, selectedActionType]);

  const paginatedLogs = useMemo(() => {
    return filteredLogs.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
    );
  }, [filteredLogs, currentPage]);

  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (!user || !user.isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Audit Log" 
        description="View system activity and important event logs."
        icon={ListChecks}
      />

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>System Event Logs</CardTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="md:col-span-2">
                <label htmlFor="search-logs" className="block text-sm font-medium text-foreground mb-1">Search Logs</label>
                <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    id="search-logs"
                    type="text"
                    placeholder="Search by user, action, target, details..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1);}}
                    className="pl-10"
                />
                </div>
            </div>
            <div>
                <label htmlFor="filter-action-type" className="block text-sm font-medium text-foreground mb-1">Filter by Action Type</label>
                <Select value={selectedActionType} onValueChange={(value) => { setSelectedActionType(value); setCurrentPage(1); }}>
                <SelectTrigger id="filter-action-type" className="w-full">
                    <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                    <SelectValue placeholder="All Action Types" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Action Types</SelectItem>
                    {uniqueActionTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[120px]">User</TableHead>
                <TableHead className="w-[150px]">Action Type</TableHead>
                <TableHead className="w-[200px]">Target</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[120px]">IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell className="text-xs">
                      {format(parseISO(log.timestamp), "MMM dd, yyyy, hh:mm:ss a")}
                    </TableCell>
                    <TableCell>
                        <Badge variant={log.user_id ? "secondary" : "outline"}>
                            {log.userName || 'System'}
                        </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">{log.action_type}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.target_entity_type && (
                        <>
                          <span className="font-medium">{log.target_entity_type}</span>
                          {log.target_entity_id && `: ${log.target_entity_id}`}
                        </>
                      )}
                      {!log.target_entity_type && 'N/A'}
                    </TableCell>
                    <TableCell className="text-xs truncate max-w-xs">{log.details || 'N/A'}</TableCell>
                    <TableCell className="text-xs">{log.ip_address || 'N/A'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">
                    No audit logs found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="self-center px-2 text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

