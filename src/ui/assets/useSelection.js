import { useRef, useState, useCallback, useEffect } from "react";

export function useSelectionHandler(items, selectedItems, setSelectedItems, multiselect = false) {
  const currentItems = useRef(items);

  const onSelect = useCallback(
    (item, e) => {
      if (multiselect && e.shiftKey) {
        if (selectedItems.indexOf(item) === -1) {
          setSelectedItems([...selectedItems, item]);
        } else {
          setSelectedItems(selectedItems.filter(i => i !== item));
        }
      } else {
        setSelectedItems([item]);
      }
    },
    [selectedItems, multiselect, setSelectedItems]
  );

  const clearSelection = useCallback(() => setSelectedItems([]), [setSelectedItems]);

  useEffect(() => {
    if (items !== currentItems.current) {
      clearSelection();
      currentItems.current = items;
    }
  }, [items, currentItems, clearSelection]);

  return [onSelect, clearSelection];
}

export function useSelection(items, initialSelection = [], multiselect = false) {
  const [selectedItems, setSelectedItems] = useState(initialSelection);
  const [onSelect, clearSelection] = useSelectionHandler(items, selectedItems, setSelectedItems, multiselect);
  return { selectedItems, setSelectedItems, onSelect, clearSelection };
}
