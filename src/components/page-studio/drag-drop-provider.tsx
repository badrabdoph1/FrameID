"use client";

import { useState, useCallback } from "react";
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
  const [overId, setOverId] = useState<string | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetId?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (targetId) setOverId(targetId);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      setOverId(null);
      if (!draggedId || draggedId === targetId || !targetId) {
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
    setOverId(null);
  }, []);

  const moveUp = useCallback((id: string) => {
    const idx = items.findIndex((item) => item.id === id);
    if (idx <= 0) return;
    const newItems = [...items];
    [newItems[idx - 1], newItems[idx]] = [newItems[idx], newItems[idx - 1]];
    onReorder(newItems.map((item) => item.id));
  }, [items, onReorder]);

  const moveDown = useCallback((id: string) => {
    const idx = items.findIndex((item) => item.id === id);
    if (idx === -1 || idx >= items.length - 1) return;
    const newItems = [...items];
    [newItems[idx], newItems[idx + 1]] = [newItems[idx + 1], newItems[idx]];
    onReorder(newItems.map((item) => item.id));
  }, [items, onReorder]);

  return (
    <div>
      {items.map((item, index) => (
        <DraggableItem
          key={item.id}
          item={item}
          index={index}
          isDragging={draggedId === item.id}
          isOver={overId === item.id && draggedId !== item.id}
          isFirst={index === 0}
          isLast={index === items.length - 1}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onMoveUp={() => moveUp(item.id)}
          onMoveDown={() => moveDown(item.id)}
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
  isOver: boolean;
  isFirst: boolean;
  isLast: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent, targetId: string) => void;
  onDrop: (e: React.DragEvent, targetId: string) => void;
  onDragEnd: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
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
  isOver,
  isFirst,
  isLast,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onMoveUp,
  onMoveDown,
  renderItem,
}: DraggableItemProps<T>) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, item.id)}
      onDragOver={(e) => onDragOver(e, item.id)}
      onDrop={(e) => onDrop(e, item.id)}
      onDragEnd={onDragEnd}
      className={cn(
        "transition-all",
        isDragging && "opacity-40 scale-95",
        isOver && "border-t-2 border-amber-300"
      )}
    >
      {renderItem({
        item,
        index,
        moveUp: onMoveUp,
        moveDown: onMoveDown,
        isFirst,
        isLast,
      })}
    </div>
  );
}
