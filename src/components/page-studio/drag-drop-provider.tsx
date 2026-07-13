"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils/cn";

interface SortableItem {
  id: string;
}

interface SimpleDragDropProviderProps<T extends SortableItem> {
  items: T[];
  onReorder: (itemIds: string[]) => void;
  renderItem: (props: {
    item: T;
    index: number;
    moveUp: () => void;
    moveDown: () => void;
    isFirst: boolean;
    isLast: boolean;
  }) => React.ReactNode;
}

export function SimpleDragDropProvider<T extends SortableItem>({
  items,
  onReorder,
  renderItem,
}: SimpleDragDropProviderProps<T>) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!draggedId || draggedId === targetId) {
        setDraggedId(null);
        return;
      }

      const oldIndex = items.findIndex((item) => item.id === draggedId);
      const newIndex = items.findIndex((item) => item.id === targetId);

      if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newItems = [...items];
        const [moved] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, moved);
        onReorder(newItems.map((item) => item.id));
      }

      setDraggedId(null);
    },
    [draggedId, items, onReorder]
  );

  const handleDragEnd = useCallback(() => {
    setDraggedId(null);
  }, []);

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, "")}
      onDragEnd={handleDragEnd}
    >
      {items.map((item, index) => (
        <DraggableItem
          key={item.id}
          item={item}
          index={index}
          isDragging={draggedId === item.id}
          isFirst={index === 0}
          isLast={index === items.length - 1}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          renderItem={renderItem}
        />
      ))}
    </div>
  );
}

interface DraggableItemProps<T extends SortableItem> {
  item: T;
  index: number;
  isDragging: boolean;
  isFirst: boolean;
  isLast: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  onDragEnd: () => void;
  renderItem: (props: {
    item: T;
    index: number;
    moveUp: () => void;
    moveDown: () => void;
    isFirst: boolean;
    isLast: boolean;
  }) => React.ReactNode;
}

function DraggableItem<T extends SortableItem>({
  item,
  index,
  isDragging,
  isFirst,
  isLast,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  renderItem,
}: DraggableItemProps<T>) {
  const moveUp = () => {};
  const moveDown = () => {};

  return (
    <>
      {renderItem({ item, index, moveUp, moveDown, isFirst, isLast })}
    </>
  );
}