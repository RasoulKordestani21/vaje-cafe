# Testing Guide: Phase 5.4 - Menu Item Reordering

## Overview
This feature allows admins to reorder menu items using drag-and-drop or up/down arrow buttons. The order persists in the database and is reflected in the customer menu view.

## Prerequisites
1. You must be logged in as an admin or super_admin
2. You should have at least 3-4 menu items created
3. The server should be running (`npm run dev`)

## Test Steps

### Test 1: Drag-and-Drop Reordering

1. **Navigate to Admin Dashboard**
   - Go to `http://localhost:3002/dashboard`
   - Login as admin if not already logged in
   - Click on the "منو" (Menu) tab

2. **Locate the Drag Handle**
   - In the menu items list, you should see a grip icon (⋮⋮) on the left side of each item
   - This is the drag handle (GripVertical icon)

3. **Drag an Item**
   - Click and hold on the grip icon of any menu item
   - Drag it up or down to a new position
   - You should see:
     - The dragged item becomes semi-transparent (opacity-50)
     - A highlight border appears where you're about to drop it
     - The item follows your mouse cursor

4. **Drop the Item**
   - Release the mouse button to drop the item in the new position
   - The items should reorder immediately
   - A success message should appear (if implemented)

5. **Verify Persistence**
   - Refresh the page (F5)
   - The items should remain in the new order
   - Check the database to verify `display_order` values were updated

### Test 2: Up/Down Arrow Buttons

1. **Locate Arrow Buttons**
   - Next to the drag handle, you should see two small arrow buttons:
     - ↑ (Arrow Up) - moves item up one position
     - ↓ (Arrow Down) - moves item down one position

2. **Test Up Arrow**
   - Click the ↑ button on any item (except the first one)
   - The item should move up one position
   - The first item's up arrow should be disabled (grayed out)

3. **Test Down Arrow**
   - Click the ↓ button on any item (except the last one)
   - The item should move down one position
   - The last item's down arrow should be disabled (grayed out)

4. **Test Edge Cases**
   - Try clicking up arrow on the first item (should be disabled)
   - Try clicking down arrow on the last item (should be disabled)
   - Verify buttons are visually disabled (reduced opacity)

### Test 3: Customer Menu View

1. **Check Customer Menu**
   - Navigate to `http://localhost:3002/menu` (customer-facing menu)
   - The items should appear in the order you set in the admin panel
   - Note: Pinned items appear first, then suggested items, then regular items ordered by `display_order`

2. **Verify Order Priority**
   - The order should be:
     1. Pinned items (ordered by display_order)
     2. Suggested items (ordered by display_order)
     3. Regular items (ordered by display_order)
   - Within each group, items should respect the `display_order` you set

### Test 4: New Item Ordering

1. **Add a New Item**
   - In the admin dashboard, add a new menu item
   - The new item should automatically get a `display_order` value (max + 1)
   - It should appear at the bottom of the list

2. **Reorder the New Item**
   - Use drag-and-drop or arrows to move the new item to a different position
   - Verify it maintains its position after refresh

### Test 5: Database Verification

1. **Check Database Directly**
   - Open the SQLite database file (usually in `data/vaje-cafe.db`)
   - Run query: `SELECT id, name, display_order FROM menu_items ORDER BY display_order;`
   - Verify `display_order` values are sequential and match the visual order

2. **Check API Response**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Refresh the menu page
   - Check the `/api/menu` response
   - Verify items are ordered correctly in the JSON response

## Expected Behavior

### Visual Feedback
- ✅ Drag handle (grip icon) visible on each item
- ✅ Arrow buttons visible next to drag handle
- ✅ Dragged item becomes semi-transparent
- ✅ Drop target shows highlight border
- ✅ Disabled buttons have reduced opacity

### Functionality
- ✅ Drag-and-drop reorders items immediately
- ✅ Arrow buttons move items one position at a time
- ✅ Order persists after page refresh
- ✅ Order applies to customer menu view
- ✅ New items get appropriate display_order

### Edge Cases
- ✅ First item's up arrow is disabled
- ✅ Last item's down arrow is disabled
- ✅ Cannot drag item to its own position
- ✅ Multiple rapid reorders work correctly

## Troubleshooting

### Issue: Drag-and-drop not working
- **Check**: Make sure you're clicking on the grip icon, not the item itself
- **Check**: Verify `onReorder` prop is passed to MenuTable component
- **Check**: Open browser console for any JavaScript errors

### Issue: Order not persisting
- **Check**: Verify API endpoint `/api/menu/reorder` is accessible
- **Check**: Check browser Network tab for failed requests
- **Check**: Verify authentication token is valid
- **Check**: Check server logs for errors

### Issue: Customer menu not showing correct order
- **Check**: Verify menu API orders by `display_order` in SQL query
- **Check**: Clear browser cache and refresh
- **Check**: Verify pinned/suggested items logic isn't overriding order

### Issue: Arrow buttons not visible
- **Check**: Verify `onReorder` prop is provided to MenuTable
- **Check**: Check if buttons are hidden by CSS (inspect element)
- **Check**: Verify icons are imported correctly

## API Testing (Optional)

You can also test the API directly using curl or Postman:

```bash
# Reorder menu items
curl -X PUT http://localhost:3002/api/menu/reorder \
  -H "Content-Type: application/json" \
  -H "Cookie: your-auth-cookie" \
  -d '{
    "itemOrders": [
      {"id": "item-id-1", "display_order": 1},
      {"id": "item-id-2", "display_order": 2},
      {"id": "item-id-3", "display_order": 3}
    ]
  }'
```

## Success Criteria

✅ All test cases pass
✅ No console errors
✅ Order persists across page reloads
✅ Customer menu reflects admin-set order
✅ Visual feedback is clear and intuitive
✅ Edge cases handled gracefully

## Notes

- The reorder functionality respects pinned and suggested items
- Pinned items always appear first, regardless of display_order
- Suggested items appear after pinned items
- Regular items are ordered by display_order within their category
- The order is applied globally, not per category



