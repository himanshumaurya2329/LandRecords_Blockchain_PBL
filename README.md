# 🏛️ Land Records PBL - Git Collaboration Guidelines

Welcome! All 18 members across all 6 groups will follow this workflow to collaborate smoothly without merge conflicts.

---

## 📌 Collaboration Workflow

### Step 1: Clone the Repository

Every collaborator must clone the repository:

```bash
git clone <REPO_URL>

cd LandRecords_extracted
```

### Step 2: Create Your Branch (Strict Rule ⚠️)

Do not push or work directly on `main`.

Create your own branch following this exact format:

- **Format:** `group-<group_no>/<your_name>`
- **Examples:**
  - `group-2/himanshu`

```bash
git checkout -b group-<group_no>/<your_name>
```

### Step 3: Work, Commit & Push

Work on your branch, commit your changes, and push to GitHub:

```bash
git add .

git commit -m "brief description of what you did"

git push origin group-<group_no>/<your_name>
```

### Step 4: Raise a Pull Request (PR)

Go to GitHub and create a Pull Request:

- **Base:** `main`
- **Compare:** `group-<group_no>/<your_name>`

### Step 5: 🛑 DO NOT MERGE THE PR!

- **No collaborator is allowed to merge their own PR.**
- Leave the PR open after creating it.
- The **Repository Owner / Lead** will review the PR:
  - If there are **no conflicts**, the PR will be merged directly into `main`.
  - If there are **conflicts**, we will discuss and resolve them together before merging.

---

## ⚠️ Important Things to Keep in Mind

1. **Never Commit Secrets:** Never commit `.env` or `.env.local` files containing passwords or API keys.

2. **Stay Updated:** Always pull the latest changes from `main` before starting new work:

```bash
git checkout main

git pull origin main

git checkout group-<group_no>/<your_name>

git merge main
```

3. **Keep Changes Modular:** Work only in your group's designated files/folders. Do not modify other groups' files or shared configs without prior discussion.

4. **Test Before Raising PR:** Make sure your code runs without breaking existing features before opening a Pull Request.
