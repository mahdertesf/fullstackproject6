// src/actions/infrastructureActions.ts
'use server';

import { prisma } from '@/lib/prisma';
import type { Building, Room } from '@prisma/client';
import type { BuildingFormData, RoomFormData } from '@/lib/schemas';

// Building Actions
export async function getAllBuildings(): Promise<Building[]> {
  try {
    return await prisma.building.findMany({ orderBy: { name: 'asc' } });
  } catch (error) {
    console.error('Error fetching buildings:', error);
    return [];
  }
}

export async function createBuilding(data: BuildingFormData): Promise<Building> {
  try {
    const newBuilding = await prisma.building.create({ data });
    // TODO: Audit log
    return newBuilding;
  } catch (error) {
    console.error('Error creating building:', error);
    throw new Error('Failed to create building.');
  }
}

export async function updateBuilding(buildingId: number, data: BuildingFormData): Promise<Building> {
  try {
    const updatedBuilding = await prisma.building.update({
      where: { building_id: buildingId },
      data,
    });
    // TODO: Audit log
    return updatedBuilding;
  } catch (error) {
    console.error(`Error updating building ${buildingId}:`, error);
    throw new Error('Failed to update building.');
  }
}

export async function deleteBuilding(buildingId: number): Promise<void> {
  try {
    const roomsCount = await prisma.room.count({ where: { building_id: buildingId }});
    if (roomsCount > 0) {
        throw new Error('Cannot delete building with associated rooms. Please reassign or delete them first.');
    }
    await prisma.building.delete({ where: { building_id: buildingId } });
    // TODO: Audit log
  } catch (error) {
    console.error(`Error deleting building ${buildingId}:`, error);
    if (error instanceof Error && error.message.includes('Cannot delete building with associated rooms')) {
        throw error;
    }
    throw new Error('Failed to delete building.');
  }
}

// Room Actions
export type RoomWithBuilding = Room & { building: Building | null };

export async function getAllRoomsWithBuilding(): Promise<RoomWithBuilding[]> {
  try {
    return await prisma.room.findMany({
      include: { building: true },
      orderBy: [{ building: { name: 'asc' } }, { room_number: 'asc' }],
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }
}

export async function createRoom(data: RoomFormData): Promise<Room> {
  try {
    const newRoom = await prisma.room.create({
      data: {
        building_id: parseInt(data.building_id),
        room_number: data.room_number,
        capacity: data.capacity,
        type: data.type,
      },
    });
    // TODO: Audit log
    return newRoom;
  } catch (error) {
    console.error('Error creating room:', error);
    throw new Error('Failed to create room.');
  }
}

export async function updateRoom(roomId: number, data: RoomFormData): Promise<Room> {
  try {
    const updatedRoom = await prisma.room.update({
      where: { room_id: roomId },
      data: {
        building_id: parseInt(data.building_id),
        room_number: data.room_number,
        capacity: data.capacity,
        type: data.type,
      },
    });
    // TODO: Audit log
    return updatedRoom;
  } catch (error) {
    console.error(`Error updating room ${roomId}:`, error);
    throw new Error('Failed to update room.');
  }
}

export async function deleteRoom(roomId: number): Promise<void> {
  try {
    const scheduledCoursesCount = await prisma.scheduledCourse.count({ where: { room_id: roomId }});
    if (scheduledCoursesCount > 0) {
        throw new Error('Cannot delete room with scheduled courses. Please reassign or remove them first.');
    }
    await prisma.room.delete({ where: { room_id: roomId } });
    // TODO: Audit log
  } catch (error) {
    console.error(`Error deleting room ${roomId}:`, error);
     if (error instanceof Error && error.message.includes('Cannot delete room with scheduled courses')) {
        throw error;
    }
    throw new Error('Failed to delete room.');
  }
}
