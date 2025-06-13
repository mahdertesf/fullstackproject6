
'use client';

import { useEffect, useState, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { HardHat, ShieldAlert, PlusCircle, Edit, Trash2, MoreHorizontal, DoorOpen } from 'lucide-react';
import { mockBuildings, mockRooms } from '@/lib/data';
import type { Building, Room } from '@/types';
import AddBuildingForm from '@/components/infrastructure/buildings/AddBuildingForm';
import EditBuildingForm from '@/components/infrastructure/buildings/EditBuildingForm';
import AddRoomForm from '@/components/infrastructure/rooms/AddRoomForm';
import EditRoomForm from '@/components/infrastructure/rooms/EditRoomForm';
import { type BuildingFormData, type RoomFormData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';

const ITEMS_PER_PAGE = 5; // Adjusted for potentially two tables

export default function InfrastructureManagementPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  // Building States
  const [buildingsList, setBuildingsList] = useState<Building[]>(mockBuildings);
  const [currentBuildingPage, setCurrentBuildingPage] = useState(1);
  const [isAddBuildingDialogOpen, setIsAddBuildingDialogOpen] = useState(false);
  const [isEditBuildingDialogOpen, setIsEditBuildingDialogOpen] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [isBuildingSubmitting, setIsBuildingSubmitting] = useState(false);

  // Room States
  const [roomsList, setRoomsList] = useState<Room[]>(mockRooms);
  const [currentRoomPage, setCurrentRoomPage] = useState(1);
  const [isAddRoomDialogOpen, setIsAddRoomDialogOpen] = useState(false);
  const [isEditRoomDialogOpen, setIsEditRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isRoomSubmitting, setIsRoomSubmitting] = useState(false);


  useEffect(() => {
    if (user && !user.isSuperAdmin) {
      router.replace('/dashboard');
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
    if (page >= 1 && page <= totalBuildingPages) {
      setCurrentBuildingPage(page);
    }
  };

  const handleOpenEditBuildingDialog = (building: Building) => {
    setEditingBuilding(building);
    setIsEditBuildingDialogOpen(true);
  };

  const handleDeleteBuilding = (buildingId: number) => {
    const buildingToDelete = buildingsList.find(b => b.building_id === buildingId);
    if (!buildingToDelete) return;
    // Also check if rooms are associated with this building before deleting (future enhancement)
    setBuildingsList(prev => prev.filter(b => b.building_id !== buildingId));
    toast({ title: 'Building Deleted (Mock)', description: `Building "${buildingToDelete.name}" has been removed.` });
  };
  
  const handleAddBuildingSubmit = async (data: BuildingFormData) => {
    setIsBuildingSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    const newBuildingId = Math.max(...buildingsList.map(b => b.building_id), 0) + 1;
    const newBuilding: Building = {
      building_id: newBuildingId,
      name: data.name,
      address: data.address || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBuildingsList(prev => [newBuilding, ...prev].sort((a,b) => a.name.localeCompare(b.name)));
    toast({ title: 'Building Created (Mock)', description: `Building "${data.name}" has been created.` });
    setIsBuildingSubmitting(false);
    setIsAddBuildingDialogOpen(false);
  };

  const handleEditBuildingSubmit = async (data: BuildingFormData) => {
    if (!editingBuilding) return;
    setIsBuildingSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setBuildingsList(prev => 
      prev.map(b => 
        b.building_id === editingBuilding.building_id 
          ? { ...b, name: data.name, address: data.address || null, updated_at: new Date().toISOString() } 
          : b
      ).sort((a,b) => a.name.localeCompare(b.name))
    );
    toast({ title: 'Building Updated (Mock)', description: `Building "${data.name}" has been updated.` });
    setIsBuildingSubmitting(false);
    setIsEditBuildingDialogOpen(false);
    setEditingBuilding(null);
  };

  // Room Logic
  const enrichedRoomsList = useMemo(() => {
    return roomsList.map(room => ({
      ...room,
      buildingName: buildingsList.find(b => b.building_id === room.building_id)?.name || 'Unknown Building'
    })).sort((a, b) => a.buildingName.localeCompare(b.buildingName) || a.room_number.localeCompare(b.room_number));
  }, [roomsList, buildingsList]);


  const paginatedRooms = useMemo(() => {
    return enrichedRoomsList.slice(
      (currentRoomPage - 1) * ITEMS_PER_PAGE,
      currentRoomPage * ITEMS_PER_PAGE
    );
  }, [enrichedRoomsList, currentRoomPage]);
  const totalRoomPages = Math.ceil(enrichedRoomsList.length / ITEMS_PER_PAGE);

  const handleRoomPageChange = (page: number) => {
    if (page >= 1 && page <= totalRoomPages) {
      setCurrentRoomPage(page);
    }
  };

  const handleOpenEditRoomDialog = (room: Room) => {
    setEditingRoom(room);
    setIsEditRoomDialogOpen(true);
  };

  const handleDeleteRoom = (roomId: number) => {
    const roomToDelete = roomsList.find(r => r.room_id === roomId);
    if (!roomToDelete) return;
    setRoomsList(prev => prev.filter(r => r.room_id !== roomId));
    toast({ title: 'Room Deleted (Mock)', description: `Room "${roomToDelete.room_number}" has been removed.` });
  };

  const handleAddRoomSubmit = async (data: RoomFormData) => {
    setIsRoomSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newRoomId = Math.max(...roomsList.map(r => r.room_id), 0) + 1;
    const newRoom: Room = {
      room_id: newRoomId,
      building_id: parseInt(data.building_id),
      room_number: data.room_number,
      capacity: data.capacity,
      type: data.type || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setRoomsList(prev => [newRoom, ...prev]);
    toast({ title: 'Room Created (Mock)', description: `Room "${data.room_number}" has been created.` });
    setIsRoomSubmitting(false);
    setIsAddRoomDialogOpen(false);
  };

  const handleEditRoomSubmit = async (data: RoomFormData) => {
    if (!editingRoom) return;
    setIsRoomSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRoomsList(prev =>
      prev.map(r =>
        r.room_id === editingRoom.room_id
          ? {
              ...r,
              building_id: parseInt(data.building_id),
              room_number: data.room_number,
              capacity: data.capacity,
              type: data.type || null,
              updated_at: new Date().toISOString(),
            }
          : r
      )
    );
    toast({ title: 'Room Updated (Mock)', description: `Room "${data.room_number}" has been updated.` });
    setIsRoomSubmitting(false);
    setIsEditRoomDialogOpen(false);
    setEditingRoom(null);
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
    <div className="space-y-8">
      <PageHeader 
        title="Campus Infrastructure" 
        description="Manage university buildings and rooms (Admin)."
        icon={HardHat}
      />
      
      {/* Building Management Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage Buildings</CardTitle>
          <Dialog open={isAddBuildingDialogOpen} onOpenChange={setIsAddBuildingDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Building
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Building</DialogTitle>
                <DialogDescription>Fill in the details to create a new campus building.</DialogDescription>
              </DialogHeader>
              <AddBuildingForm onSubmit={handleAddBuildingSubmit} onCancel={() => setIsAddBuildingDialogOpen(false)} isSubmitting={isBuildingSubmitting} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedBuildings.length > 0 ? (
                paginatedBuildings.map((building) => (
                  <TableRow key={building.building_id}>
                    <TableCell className="font-medium">{building.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground truncate max-w-xs">{building.address || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Actions</span></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditBuildingDialog(building)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteBuilding(building.building_id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={3} className="text-center h-24">No buildings found. Add one to get started.</TableCell></TableRow>
              )}
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
        <Dialog open={isEditBuildingDialogOpen} onOpenChange={(isOpen) => { setIsEditBuildingDialogOpen(isOpen); if (!isOpen) setEditingBuilding(null); }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle>Edit Building: {editingBuilding.name}</DialogTitle><DialogDescription>Modify the building details below.</DialogDescription></DialogHeader>
            <EditBuildingForm buildingToEdit={editingBuilding} onSubmit={handleEditBuildingSubmit} onCancel={() => { setIsEditBuildingDialogOpen(false); setEditingBuilding(null); }} isSubmitting={isBuildingSubmitting} />
          </DialogContent>
        </Dialog>
      )}

      {/* Room Management Section */}
      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center"><DoorOpen className="mr-2 h-5 w-5 text-primary" /> Manage Rooms</CardTitle>
           <Dialog open={isAddRoomDialogOpen} onOpenChange={setIsAddRoomDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Room
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Room</DialogTitle>
                <DialogDescription>Fill in the details to create a new room.</DialogDescription>
              </DialogHeader>
              <AddRoomForm buildings={buildingsList} onSubmit={handleAddRoomSubmit} onCancel={() => setIsAddRoomDialogOpen(false)} isSubmitting={isRoomSubmitting} />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Room Number</TableHead>
                <TableHead>Building</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRooms.length > 0 ? (
                paginatedRooms.map((room) => (
                  <TableRow key={room.room_id}>
                    <TableCell className="font-medium">{room.room_number}</TableCell>
                    <TableCell>{(room as any).buildingName || 'N/A'}</TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{room.type || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Actions</span></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenEditRoomDialog(room)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteRoom(room.room_id)} className="text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center h-24">No rooms found. Add one to get started.</TableCell></TableRow>
              )}
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
        <Dialog open={isEditRoomDialogOpen} onOpenChange={(isOpen) => { setIsEditRoomDialogOpen(isOpen); if (!isOpen) setEditingRoom(null); }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader><DialogTitle>Edit Room: {editingRoom.room_number}</DialogTitle><DialogDescription>Modify the room details below.</DialogDescription></DialogHeader>
            <EditRoomForm roomToEdit={editingRoom} buildings={buildingsList} onSubmit={handleEditRoomSubmit} onCancel={() => { setIsEditRoomDialogOpen(false); setEditingRoom(null); }} isSubmitting={isRoomSubmitting} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
