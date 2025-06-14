// src/app/(main)/admin/infrastructure/page.tsx
'use client';

import { useEffect, useState, useMemo, startTransition } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { HardHat, ShieldAlert, PlusCircle, Edit, Trash2, MoreHorizontal, DoorOpen, Loader2 } from 'lucide-react';
import type { Building, Room as PrismaRoom } from '@prisma/client';
import AddBuildingForm from '@/components/infrastructure/buildings/AddBuildingForm';
import EditBuildingForm from '@/components/infrastructure/buildings/EditBuildingForm';
import AddRoomForm from '@/components/infrastructure/rooms/AddRoomForm';
import EditRoomForm from '@/components/infrastructure/rooms/EditRoomForm';
import { type BuildingFormData, type RoomFormData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { 
    getAllBuildings, createBuilding, updateBuilding, deleteBuilding,
    getAllRoomsWithBuilding, createRoom, updateRoom, deleteRoom, type RoomWithBuilding
} from '@/actions/infrastructureActions';


const ITEMS_PER_PAGE = 5; 

export default function InfrastructureManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  // Building States
  const [buildingsList, setBuildingsList] = useState<Building[]>([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [currentBuildingPage, setCurrentBuildingPage] = useState(1);
  const [isAddBuildingDialogOpen, setIsAddBuildingDialogOpen] = useState(false);
  const [isEditBuildingDialogOpen, setIsEditBuildingDialogOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [isBuildingSubmitting, setIsBuildingSubmitting] = useState(false);

  // Room States
  const [roomsList, setRoomsList] = useState<RoomWithBuilding[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [currentRoomPage, setCurrentRoomPage] = useState(1);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [isEditRoomDialogOpen, setIsEditRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomWithBuilding | null>(null);
  const [isRoomSubmitting, setIsRoomSubmitting] = useState(false);

  const fetchAllData = async () => {
    setIsLoadingBuildings(true);
    setIsLoadingRooms(true);
    try {
      const [buildingsData, roomsData] = await Promise.all([
        getAllBuildings(),
        getAllRoomsWithBuilding()
      ]);
      setBuildingsList(buildingsData);
      setRoomsList(roomsData);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to load infrastructure data.' });
    } finally {
      setIsLoadingBuildings(false);
      setIsLoadingRooms(false);
    }
  };

  useEffect(() => {
    if (user && !user.is_super_admin) {
      router.replace('/dashboard');
    } else if (user?.is_super_admin) {
      fetchAllData();
    }
  }, [user, router]);

  // Building Logic
  const paginatedBuildings = useMemo(() => {
    return buildingsList.slice(
      (currentBuildingPage - 1) * ITEMS_PER_PAGE,
      currentBuildingPage * ITEMS_PER_PAGE
    );
  }, [buildingsList, currentBuildingPage]);
  const totalBuildingPages = Math.ceil(buildingsList.length / ITEMS_PER_PAGE);

  const handleBuildingPageChange = (page: number) => {
    if (page >= 1 && page <= totalBuildingPages) setCurrentBuildingPage(page);
  };
  const handleOpenEditBuildingDialog = (building: Building) => {
    setEditingBuilding(building); setIsEditBuildingDialogOpen(true);
  };
  const handleDeleteBuildingSubmit = async (buildingId: number) => {
    if (!confirm('Are you sure you want to delete this building? This may affect associated rooms.')) return;
    setIsBuildingSubmitting(true);
    try {
      await deleteBuilding(buildingId);
      toast({ title: 'Building Deleted' });
      startTransition(fetchAllData);
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message }); }
    finally { setIsBuildingSubmitting(false); }
  };
  const handleAddBuildingSubmit = async (data: BuildingFormData) => {
    setIsBuildingSubmitting(true);
    try {
      await createBuilding(data);
      toast({ title: 'Building Created' });
      setIsAddBuildingDialogOpen(false);
      startTransition(fetchAllData);
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message }); }
    finally { setIsBuildingSubmitting(false); }
  };
  const handleEditBuildingSubmit = async (data: BuildingFormData) => {
    if (!editingBuilding) return;
    setIsBuildingSubmitting(true);
    try {
      await updateBuilding(editingBuilding.building_id, data);
      toast({ title: 'Building Updated' });
      setIsEditBuildingDialogOpen(false); setEditingBuilding(null);
      startTransition(fetchAllData);
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message }); }
    finally { setIsBuildingSubmitting(false); }
  };

  // Room Logic
  const paginatedRooms = useMemo(() => {
    return roomsList.slice(
      (currentRoomPage - 1) * ITEMS_PER_PAGE,
      currentRoomPage * ITEMS_PER_PAGE
    );
  }, [roomsList, currentRoomPage]);
  const totalRoomPages = Math.ceil(roomsList.length / ITEMS_PER_PAGE);

  const handleRoomPageChange = (page: number) => {
    if (page >= 1 && page <= totalRoomPages) setCurrentRoomPage(page);
  };
  const handleOpenEditRoomDialog = (room: RoomWithBuilding) => {
    setEditingRoom(room); setIsEditRoomDialogOpen(true);
  };
  const handleDeleteRoomSubmit = async (roomId: number) => {
    if (!confirm('Are you sure you want to delete this room?')) return;
    setIsRoomSubmitting(true);
    try {
      await deleteRoom(roomId);
      toast({ title: 'Room Deleted' });
      startTransition(fetchAllData);
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message }); }
    finally { setIsRoomSubmitting(false); }
  };
  const handleAddRoomSubmit = async (data: RoomFormData) => {
    setIsRoomSubmitting(true);
    try {
      await createRoom(data);
      toast({ title: 'Room Created' });
      setIsAddRoomDialogOpen(false);
      startTransition(fetchAllData);
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message }); }
    finally { setIsRoomSubmitting(false); }
  };
  const handleEditRoomSubmit = async (data: RoomFormData) => {
    if (!editingRoom) return;
    setIsRoomSubmitting(true);
    try {
      await updateRoom(editingRoom.room_id, data);
      toast({ title: 'Room Updated' });
      setIsEditRoomDialogOpen(false); setEditingRoom(null);
      startTransition(fetchAllData);
    } catch (error) { toast({ variant: 'destructive', title: 'Error', description: (error as Error).message }); }
    finally { setIsRoomSubmitting(false); }
  };

  if (!user || !user.is_super_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
        <ShieldAlert className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">You do not have permission to access this page.</p>
      </div>
    );
  }
  
  const isLoading = isLoadingBuildings || isLoadingRooms;

  return (
    <div className="space-y-8">
      <PageHeader 
        title="Campus Infrastructure" 
        description="Manage university buildings and rooms."
        icon={HardHat}
      />
      
      {isLoading ? <div className="flex justify-center items-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
      <>
      {/* Building Management Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage Buildings</CardTitle>
          <Dialog open={isAddBuildingDialogOpen} onOpenChange={setIsAddBuildingDialogOpen}>
            <DialogTrigger asChild>
              <Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Building</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader><DialogTitle>Add New Building</DialogTitle><DialogDescription>Fill in details.</DialogDescription></DialogHeader>
              <AddBuildingForm onSubmit={handleAddBuildingSubmit} onCancel={() => setIsAddBuildingDialogOpen(false)} isSubmitting={isBuildingSubmitting} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Address</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {paginatedBuildings.length > 0 ? paginatedBuildings.map(b => (
                <TableRow key={b.building_id}>
                  <TableCell className="font-medium">{b.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{b.address || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={isBuildingSubmitting}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEditBuildingDialog(b)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteBuildingSubmit(b.building_id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={3} className="text-center h-24">No buildings found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {totalBuildingPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button variant="outline" onClick={() => handleBuildingPageChange(currentBuildingPage - 1)} disabled={currentBuildingPage === 1}>Previous</Button>
          <span className="self-center px-2">Page {currentBuildingPage} of {totalBuildingPages}</span>
          <Button variant="outline" onClick={() => handleBuildingPageChange(currentBuildingPage + 1)} disabled={currentBuildingPage === totalBuildingPages}>Next</Button>
        </div>
      )}
      {editingBuilding && (
        <Dialog open={isEditBuildingDialogOpen} onOpenChange={v => { setIsEditBuildingDialogOpen(v); if (!v) setEditingBuilding(null); }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle>Edit Building: {editingBuilding.name}</DialogTitle></DialogHeader>
            <EditBuildingForm buildingToEdit={editingBuilding} onSubmit={handleEditBuildingSubmit} onCancel={() => { setIsEditBuildingDialogOpen(false); setEditingBuilding(null); }} isSubmitting={isBuildingSubmitting} />
          </DialogContent>
        </Dialog>
      )}

      {/* Room Management Section */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center"><DoorOpen className="mr-2 h-5 w-5 text-primary" /> Manage Rooms</CardTitle>
           <Dialog open={isAddRoomDialogOpen} onOpenChange={setIsAddRoomDialogOpen}>
            <DialogTrigger asChild><Button><PlusCircle className="mr-2 h-4 w-4" /> Add New Room</Button></DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader><DialogTitle>Add New Room</DialogTitle></DialogHeader>
              <AddRoomForm buildings={buildingsList} onSubmit={handleAddRoomSubmit} onCancel={() => setIsAddRoomDialogOpen(false)} isSubmitting={isRoomSubmitting} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Room Number</TableHead><TableHead>Building</TableHead><TableHead>Capacity</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {paginatedRooms.length > 0 ? paginatedRooms.map(r => (
                <TableRow key={r.room_id}>
                  <TableCell className="font-medium">{r.room_number}</TableCell>
                  <TableCell>{r.building?.name || 'N/A'}</TableCell>
                  <TableCell>{r.capacity}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.type || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={isRoomSubmitting}><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenEditRoomDialog(r)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteRoomSubmit(r.room_id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={5} className="text-center h-24">No rooms found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {totalRoomPages > 1 && (
        <div className="flex justify-center mt-4 space-x-2">
          <Button variant="outline" onClick={() => handleRoomPageChange(currentRoomPage - 1)} disabled={currentRoomPage === 1}>Previous</Button>
          <span className="self-center px-2">Page {currentRoomPage} of {totalRoomPages}</span>
          <Button variant="outline" onClick={() => handleRoomPageChange(currentRoomPage + 1)} disabled={currentRoomPage === totalRoomPages}>Next</Button>
        </div>
      )}
      {editingRoom && (
        <Dialog open={isEditRoomDialogOpen} onOpenChange={v => { setIsEditRoomDialogOpen(v); if (!v) setEditingRoom(null); }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle>Edit Room: {editingRoom.room_number}</DialogTitle></DialogHeader>
            <EditRoomForm roomToEdit={editingRoom as PrismaRoom} buildings={buildingsList} onSubmit={handleEditRoomSubmit} onCancel={() => { setIsEditRoomDialogOpen(false); setEditingRoom(null); }} isSubmitting={isRoomSubmitting} />
          </DialogContent>
        </Dialog>
      )}
      </>
      )}
    </div>
  );
}
