# Auto-Save Implementation - Quick Reference Guide

## ✅ Completed
- **SurveyorFields.tsx** - Auto-save with visual indicators ✅
- **ClerkFields.tsx** - Auto-save with visual indicators ✅  
- **official-dashboard** - Warning modal for unsaved data ✅

## 🔄 To Do (Apply Same Pattern)

Apply the auto-save pattern to these role components:

### Priority 1 (Most Important)
1. **SuperintendentFields.tsx**
2. **RevenueInspectorFields.tsx**
3. **VROFields.tsx**

### Priority 2 (Important)
4. **ProjectOfficerFields.tsx**
5. **RevenueDeptOfficerFields.tsx**
6. **JointCollectorFields.tsx**
7. **DistrictCollectorFields.tsx**

### Priority 3 (Secondary)
8. **MinistryWelfareFields.tsx**
9. **MROFields.tsx**

## How to Apply (Copy-Paste Pattern)

For each component, add these at the top:

```typescript
'use client';

import { useState, useEffect, useRef } from 'react';
// ... other imports ...
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
```

After your state declarations, add:

```typescript
const [dataSaved, setDataSaved] = useState(true);
const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

// Auto-save effect - triggers when any field changes
useEffect(() => {
  // Clear any pending auto-save
  if (autoSaveTimeoutRef.current) {
    clearTimeout(autoSaveTimeoutRef.current);
  }

  // Mark as unsaved
  setDataSaved(false);

  // Auto-save after 2 seconds of inactivity
  autoSaveTimeoutRef.current = setTimeout(() => {
    handleSave(true); // true = silent auto-save
  }, 2000);

  return () => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
  };
}, [/* ALL YOUR FORM FIELDS HERE */]);
```

Update handleSave signature:

```typescript
const handleSave = async (isSilent: boolean = false) => {
  try {
    setSaving(true);
    // ... your existing save logic ...
    
    if (response.ok) {
      setDataSaved(true);  // <-- ADD THIS LINE
      if (!isSilent) {
        alert('Data saved successfully!');
      }
      if (onUpdate) onUpdate();
    } else if (!isSilent) {
      alert('Failed to save data');
    }
  } catch (error) {
    console.error(error);
    if (!isSilent) {
      alert('Failed to save data');
    }
  } finally {
    setSaving(false);
  }
};
```

Update your component return JSX:

```typescript
return (
  <div 
    className="bg-white/10 backdrop-blur-lg rounded-2xl border border-[color]/20 p-6 mb-6" 
    data-unsaved-data={!dataSaved ? 'true' : 'false'}
  >
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-xl font-bold text-[color] flex items-center gap-2">
        <FaIcon />
        📌 Your Title
      </h2>
      <div className="flex items-center gap-2">
        {dataSaved ? (
          <div className="flex items-center gap-1 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg">
            <FaCheckCircle className="text-green-400" size={14} />
            <span className="text-xs text-green-300 font-semibold">Auto-saved</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <FaExclamationTriangle className="text-yellow-400" size={14} />
            <span className="text-xs text-yellow-300 font-semibold">Saving...</span>
          </div>
        )}
      </div>
    </div>
    
    {/* Your existing form fields */}
    
    <button
      onClick={() => handleSave(false)}  // <-- CHANGE FROM onClick={handleSave}
      disabled={saving}
      className="..."
    >
      {saving ? 'Saving...' : '💾 Save Data'}
    </button>
  </div>
);
```

## Key Points

1. **Imports**: Make sure to import `useEffect` and `useRef` from React
2. **Import Icons**: Add `FaCheckCircle, FaExclamationTriangle` from 'react-icons/fa'
3. **Dependency Array**: Include ALL form fields in the useEffect dependency array
4. **data-unsaved-data**: Add to root component div for detection
5. **Button onClick**: Change from `onClick={handleSave}` to `onClick={() => handleSave(false)}`
6. **Silent Saves**: The auto-save uses `handleSave(true)` - no alerts

## Example (SuperintendentFields.tsx)

Looking at SuperintendentFields.tsx, it probably has fields like:
- remarksForClerk
- verificationStatus
- nextStepsRemarks

Your dependency array should be:
```typescript
}, [remarksForClerk, verificationStatus, nextStepsRemarks]);
```

## Testing After Each Component Update

For each component:
1. Open application as that official
2. Start entering data
3. Watch for status badges:
   - ⚠️ Yellow "Saving..." appears immediately
   - ✅ Green "Auto-saved" appears after 2 seconds
4. Try to approve WITHOUT saving manually
   - Warning modal should appear
   - Click "Wait & Proceed"
   - Should successfully approve
5. Check admin dashboard - data should be attached to action history

## Batch Implementation Tips

- Update components one by one
- Test each before moving to next
- Share this pattern with other developers
- Keep this file as reference

## Common Mistakes to Avoid

❌ **Don't forget `useRef` import**
```typescript
import { useState, useEffect, useRef } from 'react'; // ✅ CORRECT
import { useState, useEffect } from 'react'; // ❌ MISSING useRef
```

❌ **Don't forget `data-unsaved-data` attribute**
```typescript
<div data-unsaved-data={!dataSaved ? 'true' : 'false'}> // ✅ CORRECT
<div> // ❌ MISSING - warning won't detect unsaved data
```

❌ **Don't forget dependency array**
```typescript
}, [remarksForClerk, verificationStatus]); // ✅ CORRECT
}); // ❌ MISSING - won't auto-save
```

❌ **Don't forget to pass isSilent to manual save**
```typescript
onClick={() => handleSave(false)} // ✅ CORRECT - shows alert
onClick={handleSave} // ❌ WRONG - type error
```

## Questions?

Refer to the completed examples:
- **SurveyorFields.tsx** - Complete with GPS and photos
- **ClerkFields.tsx** - Simple with form fields

Both have the full implementation.
