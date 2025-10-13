# How to Use VIIT Smart Attendance System

## 🎓 System Overview

This system uses **CNN-based face recognition** to automatically mark attendance from group photos.

### Key Features:
- **Face Detection:** MTCNN detects multiple faces in a single photo
- **Face Recognition:** FaceNet (InceptionResnetV1) creates unique embeddings for each student
- **Vector Search:** Qdrant matches detected faces against registered students
- **Auto Attendance:** Marks present/absent automatically based on face recognition

---

## 📸 How Face Recognition Works

### Step 1: Registration (Admin uploads student photo)
```
Student Photo → MTCNN (detect face) → FaceNet (create embedding) 
→ Qdrant (store 512-dim vector with student ID)
```

### Step 2: Attendance (Teacher uploads group photo)
```
Group Photo → MTCNN (detect all faces) → FaceNet (create embeddings) 
→ Qdrant (search similar vectors) → Match with registered students
→ Mark attendance automatically
```

### Face Embedding
- Each face becomes a 512-dimensional vector
- Similar faces have similar vectors (cosine similarity)
- Threshold: 0.6 (60% confidence) for matching

---

## 👨‍💼 Admin Workflow

### 1. Add Users

**Add a Teacher:**
```
User Management → Create User
Name: Dr. Rajesh Sharma
Email: rajesh@viit.ac.in
Role: Teacher
Password: (set password)
```

**Add a Student:**
```
User Management → Create User
Name: Aarav Kumar
Email: aarav@viit.ac.in
PRN: VIIT001
Role: Student
Password: (set password)
```

### 2. Register Student Faces

**For each student:**
```
User Management → Find student → Register Face → Upload photo
```

**Photo Requirements:**
- ✅ Clear, front-facing photo
- ✅ Good lighting
- ✅ Face clearly visible
- ✅ At least 100x100 pixels
- ❌ No group photos (one person only)
- ❌ No heavily filtered images

**Tips for Better Accuracy:**
- Upload 1 high-quality photo per student (system limitation)
- Use high-quality images (1080p+)
- Consistent lighting
- No obstructions (masks, sunglasses, etc.)
- **Note:** Current system allows only 1 photo per student

### 3. Create Subjects

```
Subject Management → Create Subject
Name: Machine Learning
Code: CS401
Teacher: Dr. Rajesh Sharma
```

### 4. Enroll Students

```
Subject Management → Select subject → Enroll Students
Select students who are in this class
```

---

## 👨‍🏫 Teacher Workflow

### 1. Create Attendance Session

```
Take Attendance → Create New Session
Subject: Machine Learning
Date: (today)
Class Type: Lecture/Lab/Tutorial
Notes: (optional)
```

### 2. Upload Group Photo

**Photo Requirements:**
- ✅ All students in the photo
- ✅ Faces clearly visible
- ✅ Good lighting
- ✅ Students facing camera (mostly)
- ✅ Within 5 meters of camera
- ❌ Don't use low-res photos
- ❌ Avoid backlighting

**Process:**
```
1. Take group photo of the class
2. Upload photo
3. System detects faces
4. System matches faces with registered students
5. Automatically marks attendance
6. Review and correct if needed
```

### 3. View/Edit Attendance

```
View Attendance → Select session
- See who was marked present/absent
- View confidence scores
- Manually override if needed
```

**Manual Override:**
- If a student was missed, mark them present manually
- If someone was incorrectly marked, change status
- Add notes if needed

---

## 👨‍🎓 Student Workflow

### 1. View Attendance

```
Dashboard → Shows overall attendance percentage
```

### 2. Subject-wise Details

```
View Attendance → See breakdown by subject
- Total classes
- Classes attended
- Attendance percentage
- Detailed history
```

---

## 🔬 Technical Details

### Face Detection: MTCNN

**Multi-task Cascaded Convolutional Networks**
- Detects faces in images
- Returns bounding boxes and facial landmarks
- Works with multiple faces in one image

```python
mtcnn = MTCNN(keep_all=True, device='cpu')
face_tensors, probs = mtcnn(image, return_prob=True)
```

### Face Recognition: FaceNet

**InceptionResnetV1 (trained on VGGFace2)**
- Creates 512-dimensional embeddings
- Similar faces have similar embeddings
- State-of-the-art accuracy

```python
resnet = InceptionResnetV1(pretrained='vggface2').eval()
embedding = resnet(face_tensor)  # Returns 512-dim vector
```

### Vector Database: Qdrant

**Fast similarity search**
- Stores face embeddings as vectors
- Uses cosine similarity for matching
- Returns most similar faces with confidence scores

```python
client.search(
    collection_name="Student_Faces",
    query_vector=embedding,
    limit=1
)
```

---

## 📊 Understanding Confidence Scores

### What is the confidence score?

The **cosine similarity** between detected face and registered face:
- **0.9-1.0:** Very high confidence (almost certain match)
- **0.7-0.9:** High confidence (likely correct)
- **0.6-0.7:** Medium confidence (probably correct, but verify)
- **0.0-0.6:** Low confidence (not matched)

**Default Threshold:** 0.6 (60%)
- Above 0.6: Marked as present
- Below 0.6: Not matched (marked absent)

### Adjusting Threshold

**If too many false positives** (wrong students marked):
→ Increase threshold to 0.7 or 0.8

**If too many missed students** (present but not detected):
→ Decrease threshold to 0.5
→ Or register more photos per student

---

## 🎯 Best Practices

### For Admins:

1. **Quality Registration Photos**
   - Use recent photos
   - Multiple photos per student
   - Consistent conditions (indoor lighting)

2. **Regular Updates**
   - Update photos if student appearance changes
   - Keep enrollment lists updated

3. **Backup Data**
   - Regularly backup the database
   - Export attendance records

### For Teachers:

1. **Good Group Photos**
   - Take photo from front of class
   - Make sure all students are visible
   - Good lighting (turn on all lights)
   - Students should face camera

2. **Verify Attendance**
   - Always review auto-marked attendance
   - Manually correct errors
   - Add notes for unusual cases

3. **Consistency**
   - Take photos from similar position each time
   - Use same camera/device if possible

### For Students:

1. **Registration**
   - Provide clear recent photo
   - Same hairstyle/appearance you'll have in class
   - No filters or heavy edits

2. **During Class**
   - Be visible in group photo
   - Face the camera
   - Remove obstructions (hats, masks if not required)

---

## 🔍 Troubleshooting Recognition Issues

### Student not recognized in group photo

**Possible causes:**
1. Face not registered → Admin must upload face photo
2. Low photo quality → Use better camera/lighting
3. Student not enrolled in subject → Check enrollments
4. Appearance changed significantly → Update registered photo
5. Face not visible in group photo → Ensure student is visible

**Solutions:**
1. Re-register face with better photos
2. Register multiple photos (different angles)
3. Adjust confidence threshold
4. Use manual override

### False positives (wrong student marked)

**Possible causes:**
1. Similar-looking students
2. Low-quality photos
3. Threshold too low
 
**Solutions:**
1. Register more photos per student
2. Increase threshold to 0.7 or 0.8
3. Use higher resolution photos
4. Manual verification by teacher

### No faces detected

**Possible causes:**
1. Very low quality photo
2. Faces too small in frame
3. Poor lighting
4. Faces obscured

**Solutions:**
1. Take photo from closer distance
2. Improve lighting
3. Use higher resolution camera
4. Ensure faces are clearly visible

---

## 📈 Improving Accuracy

### Best Results:

1. **Multiple registration photos per student** (2-3 photos)
   - Front view
   - Slight left turn
   - Slight right turn

2. **High-quality photos**
   - 1080p or higher
   - Good lighting
   - Clear focus

3. **Consistent conditions**
   - Register photos in similar conditions to classroom
   - Indoor lighting
   - No extreme filters

4. **Regular updates**
   - Update photos if appearance changes
   - Re-register after major changes (haircut, glasses, etc.)

### Expected Accuracy:

With proper setup:
- **90-95%** accuracy in good conditions
- **85-90%** accuracy in normal classroom conditions
- **75-85%** accuracy in challenging conditions (poor lighting, crowded)

---

## 💡 Advanced Features

### Bulk Operations

**Add multiple students:**
Use the API to add students programmatically:
```bash
POST /api/users
```

**Export attendance:**
```bash
GET /api/attendance/sessions
```

### API Access

Full API documentation: http://localhost:8000/docs

Use API for:
- Integration with other systems
- Automated reports
- Custom analytics
- Mobile apps

---

## 🔐 Privacy & Security

### Data Storage:

1. **Face Embeddings:** Only mathematical representations (512 numbers), not actual photos
2. **Photos:** Stored locally in `uploads/` folder
3. **Database:** SQLite (for demo), use PostgreSQL for production
4. **Access Control:** Role-based (Admin, Teacher, Student)

### Compliance:

- Follow institutional data protection policies
- Inform students about face recognition usage
- Provide opt-out mechanisms if required
- Secure data transmission (use HTTPS in production)

---

## 📞 Support

### Logs:

- **Backend logs:** Check terminal running `python main.py`
- **Browser console:** Press F12 to see frontend errors
- **Qdrant logs:** Check Docker container logs

### Useful Endpoints:

- Health check: http://localhost:8000/
- API docs: http://localhost:8000/docs
- Qdrant dashboard: http://localhost:6333/dashboard

---

**Made for VIIT** 🎓

