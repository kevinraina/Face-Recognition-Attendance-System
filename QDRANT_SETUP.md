# 🔧 Qdrant Setup Guide

## ⚠️ **Important: You MUST Start Qdrant First!**

The Face Management system requires **Qdrant** (a vector database) to store face embeddings. Without it, you'll get **500 Internal Server Error** when:
- Uploading face photos
- Viewing face photos
- Taking attendance with group photos

---

## 🚀 **How to Start Qdrant**

### **1. Start Qdrant Container**
```bash
docker run -d -p 6333:6333 -p 6334:6334 --name qdrant qdrant/qdrant:latest
```

### **2. Verify Qdrant is Running**
```bash
curl http://localhost:6333/
```

You should see:
```json
{"title":"qdrant - vector search engine","version":"1.15.5",...}
```

### **3. Restart the Backend**
After starting Qdrant, restart your backend:
```bash
pkill -f "python main.py"
cd Model
source venv/bin/activate
python main.py
```

---

## 🔄 **Complete Startup Sequence (Every Time)**

**Terminal 1 - Start Qdrant (if not already running):**
```bash
docker start qdrant || docker run -d -p 6333:6333 -p 6334:6334 --name qdrant qdrant/qdrant:latest
```

**Terminal 2 - Start Backend:**
```bash
cd /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN/Model
source venv/bin/activate
python main.py
```

**Terminal 3 - Start Frontend:**
```bash
cd /home/kevin/Real-Time-Person-Detection-in-Crowds-Using-CNN
npm run dev
```

---

## 🛠️ **Qdrant Management Commands**

### **Check if Qdrant is Running**
```bash
docker ps | grep qdrant
```

### **Stop Qdrant**
```bash
docker stop qdrant
```

### **Start Existing Qdrant Container**
```bash
docker start qdrant
```

### **Remove Qdrant Container** (⚠️ This deletes all face data!)
```bash
docker stop qdrant
docker rm qdrant
```

### **View Qdrant Logs**
```bash
docker logs qdrant
```

---

## 🐛 **Troubleshooting**

### **Error: "Connection refused [Errno 111]"**
**Problem:** Qdrant is not running.

**Solution:**
```bash
docker start qdrant || docker run -d -p 6333:6333 -p 6334:6334 --name qdrant qdrant/qdrant:latest
# Then restart backend
pkill -f "python main.py"
cd Model && source venv/bin/activate && python main.py
```

### **Error: "500 Internal Server Error" when uploading photos**
**Problem:** Backend can't connect to Qdrant.

**Solution:**
1. Check Qdrant is running: `docker ps | grep qdrant`
2. Check Qdrant is responding: `curl http://localhost:6333/`
3. Restart backend after Qdrant is running

### **Error: "port is already allocated"**
**Problem:** Another container is using port 6333.

**Solution:**
```bash
docker stop qdrant
docker rm qdrant
docker run -d -p 6333:6333 -p 6334:6334 --name qdrant qdrant/qdrant:latest
```

---

## 📦 **What is Qdrant?**

Qdrant is a **vector database** that stores face embeddings (mathematical representations of faces). When you upload a photo:

1. **MTCNN** detects faces in the photo
2. **FaceNet** generates a 512-dimensional embedding vector
3. **Qdrant** stores this vector with student metadata
4. During attendance, the system searches Qdrant to find matching faces

**Why use Qdrant?**
- ⚡ Extremely fast similarity search
- 🔍 Can search millions of faces in milliseconds
- 📊 Optimized for high-dimensional vectors
- 🎯 Built specifically for ML/AI applications

---

## ✅ **Status Check**

Run this to verify everything is working:
```bash
echo "=== Checking System Status ==="
echo ""
echo "1. Qdrant Status:"
docker ps | grep qdrant && echo "✅ Qdrant is running" || echo "❌ Qdrant is NOT running"
echo ""
echo "2. Qdrant API:"
curl -s http://localhost:6333/ | grep -q "qdrant" && echo "✅ Qdrant API is responding" || echo "❌ Qdrant API is NOT responding"
echo ""
echo "3. Backend Status:"
curl -s http://localhost:8000/ | grep -q "healthy" && echo "✅ Backend is running" || echo "❌ Backend is NOT running"
echo ""
echo "4. Frontend Status:"
curl -s http://localhost:5173/ | grep -q "html" && echo "✅ Frontend is running" || echo "❌ Frontend is NOT running"
```

---

## 🎯 **Remember:**

**Qdrant MUST be running before:**
- ✅ Uploading face photos (User Management → Add Photos)
- ✅ Viewing face photos (Face Management)
- ✅ Taking attendance with group photos (Teacher → Take Attendance)

**If Qdrant is not running, you'll see:**
- ❌ "500 Internal Server Error"
- ❌ "Failed to load face data"
- ❌ Backend logs show: "Connection refused [Errno 111]"

---

## 📝 **Quick Reference**

| Action | Command |
|--------|---------|
| Start Qdrant | `docker run -d -p 6333:6333 -p 6334:6334 --name qdrant qdrant/qdrant:latest` |
| Start existing Qdrant | `docker start qdrant` |
| Stop Qdrant | `docker stop qdrant` |
| Check Qdrant | `docker ps \| grep qdrant` |
| Test Qdrant API | `curl http://localhost:6333/` |
| View Qdrant logs | `docker logs qdrant` |

---

**✅ QDRANT IS NOW RUNNING!** Your Face Management should work now. Refresh the page and try again.

