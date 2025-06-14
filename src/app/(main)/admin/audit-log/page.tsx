// src/app/(main)/admin/audit-log/page.tsx
'use client';

import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo, startTransition } from 'react';
import { ListChecks, ShieldAlert, Search, Filter, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AuditLog as AuditLogType, User as PrismaUser } from '@prisma/client';
import { format, parseISO } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { getAuditLogs, getUniqueActionTypes, type PaginatedAuditLogs } from '@/actions/adminActions';

interface EnrichedAuditLog extends AuditLogType {
  user?: { username: string } | null; // Prisma relation might give user object or null
}

export default function AuditLogPage() {
  const { user: currentUser } = useAuthStore();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionType, setSelectedActionType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [auditData, setAuditData] = useState<PaginatedAuditLogs | null>(null);
  const [uniqueActions, setUniqueActions] = useState<string[]>([]);
  
  const ITEMS_PER_PAGE = 15;

  const fetchAuditData = async (page = 1) => {
    setIsLoading(true);
    try {
      const data = await getAuditLogs({ 
        searchTerm, 
        actionType: selectedActionType, 
        page, 
        pageSize: ITEMS_PER_PAGE 
      });
      setAuditData(data);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      setAuditData({ logs: [], totalCount: 0, totalPages: 0, currentPage: 1 });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchActionTypes = async () => {
      try {
          const types = await getUniqueActionTypes();
          setUniqueActions(types);
      } catch (error) {
          console.error('Failed to fetch unique action types:', error);
      }
  };

  useEffect(() => {
    if (currentUser && !currentUser.is_super_admin) {
      router.replace('/dashboard');
    } else if (currentUser?.is_super_admin) {
        fetchActionTypes(); // Fetch once
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (currentUser?.is_super_admin) {
      startTransition(() => {
        fetchAuditData(currentPage);
      });
    }
  }, [currentUser, currentPage, searchTerm, selectedActionType]);


  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (auditData?.totalPages || 1)) {
      setCurrentPage(newPage);
    }
  };

  if (!currentUser || !currentUser.is_super_admin) {
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
                    {uniqueActions.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                </SelectContent>
                </Select>
            </div>
            </div>
        </CardHeader>
        <CardContent>
          {isLoading && !auditData ? (
             <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
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
              {auditData && auditData.logs.length > 0 ? (
                auditData.logs.map((log) => (
                  <TableRow key={log.log_id}>
                    <TableCell className="text-xs">
                      {format(parseISO(log.timestamp.toString()), "MMM dd, yyyy, hh:mm:ss a")}
                    </TableCell>
                    <TableCell>
                        <Badge variant={log.user_id ? "secondary" : "outline"}>
                            {log.user?.username || 'System'}
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
                    {isLoading ? <Loader2 className="h-6 w-6 animate-spin mx-auto"/> : 'No audit logs found matching your criteria.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {auditData && auditData.totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button
            variant="outline"
            onClick={() => handlePageChange(auditData.currentPage - 1)}
            disabled={auditData.currentPage === 1 || isLoading}
          >
            Previous
          </Button>
          <span className="self-center px-2 text-sm">
            Page {auditData.currentPage} of {auditData.totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => handlePageChange(auditData.currentPage + 1)}
            disabled={auditData.currentPage === auditData.totalPages || isLoading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
