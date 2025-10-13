# 📸 How to Upload MULTIPLE Photos - Quick Guide

## 🚨 **You're Only Uploading ONE Photo Because...**

You're clicking on a SINGLE file in the file picker! The system **DOES** support unlimited uploads, but you need to **SELECT MULTIPLE FILES**.

---

## ✅ **How to Select MULTIPLE Photos:**

### **Method 1: Ctrl+Click (Recommended)**
1. Click "Add Photos" button
2. In the file picker, click the **first photo**
3. **Hold `Ctrl`** key (or `Cmd` on Mac)
4. **While holding Ctrl**, click additional photos
5. Click "Open" - all selected photos will upload!

### **Method 2: Shift+Click (Range Selection)**
1. Click "Add Photos" button
2. Click the **first photo**
3. **Hold `Shift`** key
4. Click the **last photo** you want
5. All photos between first and last will be selected!
6. Click "Open"

### **Method 3: Drag Selection**
1. Click "Add Photos" button
2. Click and **drag** to draw a selection box around multiple photos
3. Release mouse - all photos in the box are selected
4. Click "Open"

### **Method 4: Ctrl+A (Select All)**
1. Click "Add Photos" button
2. Press **`Ctrl+A`** (or `Cmd+A` on Mac)
3. All photos in the folder are selected!
4. Click "Open"

---

## 👁️ **How to VIEW Uploaded Photos:**

### **Step 1: Go to Dashboard**
After refreshing the page, you'll see a new card:

```
┌──────────────────────────────┐
│  📷 Face Management          │
│  View and manage student     │
│  face photos                 │
│                              │
│        [ Access ]            │
└──────────────────────────────┘
```

### **Step 2: Click "Face Management"**
You'll see two panels:

**Left Panel:** List of all students
**Right Panel:** Their uploaded photos (click student to view)

### **Step 3: Select a Student**
Click on any student name to see:
- ✅ Total number of photos uploaded
- ✅ When each photo was registered
- ✅ Unique ID for each photo
- ✅ Delete individual photos
- ✅ Delete all photos

---

## 📊 **Current Upload Status:**

From your screenshot, you successfully uploaded:
- ✅ **1 photo for Aditya Verma**

But the system message shows **"Successfully uploaded 1 out of 1 photos!"**

This means you only **SELECTED 1 photo**. If you had selected 3 photos, it would say **"Successfully uploaded 3 out of 3 photos!"**

---

## 🎯 **Quick Test:**

1. **Refresh the page** (Ctrl+F5 or F5)
2. You should see **"Face Management"** card on dashboard
3. Click **"Face Management"**
4. Click on **"Aditya Verma"** in the left panel
5. You should see **"1 photo registered"** in the right panel
6. Now go back to **"User Management"**
7. Click **"Add Photos"** for Aditya again
8. This time, **hold Ctrl and click 3 photos** (or use Ctrl+A)
9. Click "Open"
10. You should see **"Successfully uploaded 3 out of 3 photos!"**
11. Go back to **"Face Management"** → **"Aditya Verma"**
12. You should now see **"4 photos registered"** (1 + 3 = 4)

---

## 🔧 **Troubleshooting:**

### **"I'm holding Ctrl but only one file is selected"**
- Make sure you're **holding Ctrl WHILE clicking** each file
- Don't release Ctrl until you've clicked all files
- On Linux, sometimes it's `Ctrl`, sometimes it's `Shift`

### **"The file picker doesn't show multiple files"**
- Make sure you're in a folder with multiple image files
- Try using Shift+Click to select a range
- Try Ctrl+A to select all

### **"I don't see Face Management card"**
- Refresh the page (Ctrl+F5)
- Make sure you're logged in as **Admin**
- The card should appear after the "Schedule Management" card

### **"Face Management says 'Failed to load'"**
- Make sure the backend is running
- Check terminal for errors
- The backend needs to be running for the face data API to work

---

## ✨ **Best Practices:**

1. **Upload 3-5 photos per student** for best accuracy
2. **Vary the photos**: different angles, lighting, expressions
3. **Use clear, well-lit photos** for better face detection
4. **Front-facing photos work best** (MTCNN prefers frontal faces)
5. **One face per photo** (don't upload group photos for registration)

---

## 📝 **Summary:**

**Problem:** You thought the system only accepts one photo
**Reality:** The system accepts UNLIMITED photos - you just need to select more than one!

**Solution:** 
- Use **Ctrl+Click** to select multiple files
- Check uploaded photos in **Face Management** (new dashboard card)

**Refresh your browser now and you'll see the Face Management card!** 🎉

