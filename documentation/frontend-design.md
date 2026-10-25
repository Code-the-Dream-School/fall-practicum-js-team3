# BlockCAD Frontend Design Documentation

Table of contents

1. [Overview](#1-overview)
2. [Design Resources](#2-design-resources)
3. [Main User Flow](#3-main-user-flow)
4. [Application Screens](#4-application-screens)
   - [4.1 Login](#41-login)
   - [4.2 Registration](#42-registration)
   - [4.3 Project Dashboard](#43-project-dashboard)
   - [4.4 3D Editor](#44-3d-editor)
5. [Project Save / Load](#5-project-save--load)
   - [5.1 Save Project](#51-save-project)
   - [5.2 Open Project](#52-open-project)
6. [STL Export](#6-stl-export)
7. [Frontend Component Inventory](#7-frontend-component-inventory)
8. [Loading, Empty, Error, and Success States](#8-loading-empty-error-and-success-states)
9. [Accessibility Considerations](#9-accessibility-considerations)
10. [Responsive Design Considerations](#10-responsive-design-considerations)
11. [Frontend / Backend Data Interaction](#11-frontend--backend-data-interaction)
12. [Open Design Questions](#12-open-design-questions)
13. [Design Decisions](#13-design-decisions)
14. [Known Limitations / Out of Scope for MVP](#14-known-limitations--out-of-scope-for-mvp)
15. [Revision Notes](#15-revision-notes)

## 1. Overview

Briefly describe the purpose of the BlockCAD frontend.

Example:

BlockCAD is a web-based 3D design application that allows users to create, edit, save, and export simple 3D models. This document describes the frontend structure, user flows, major UI components, interaction behavior, and important frontend states for the MVP.

---

## 2. Design Resources

### Figma

- Wireframes / UI design:
  - [Add Figma link here]

### Related Documentation

- API Documentation:
  - [Add API documentation link here]
- Database Schema:
  - [Add database schema link here]

---

## 3. Main User Flow

```text
Register / Log In
       ↓
Project Dashboard
       ↓
Create or Open Project
       ↓
3D Editor
       ↓
Add / Select / Manipulate Shapes
       ↓
Save Project
       ↓
Export STL
```

Additional flow:

```text
Project Dashboard
       ↓
Open Existing Project
       ↓
Load Saved Project Data
       ↓
Reconstruct Design in 3D Editor
```

---

## 4. Application Screens

### 4.1 Login

**Purpose:**  
Allow an existing user to authenticate.

**Main UI Elements:**

- Email input
- Password input
- Log In button
- Link to registration

**Expected Behavior:**

- Validate required fields
- Display feedback for failed login
- Redirect authenticated users to the Project Dashboard

**Open Questions:**

- [Add questions here]

---

### 4.2 Registration

**Purpose:**  
Allow a new user to create an account.

**Main UI Elements:**

- Name input
- Email input
- Password input
- Confirm password input, if required
- Create Account button
- Link to login

**Expected Behavior:**

- Validate required fields
- Handle duplicate accounts
- Display validation errors
- Redirect successful registration to the appropriate next screen

**Open Questions:**

- [Add questions here]

---

### 4.3 Project Dashboard

**Purpose:**  
Allow users to view, search, create, and open their saved projects.

**Main UI Elements:**

- Header/navigation
- New Project button
- Project search
- Project cards/list
- User/account controls

**Expected Behavior:**

- Display only projects belonging to the authenticated user
- Allow users to search projects by name
- Allow users to create a new project
- Allow users to open an existing project

**Important States:**

- Loading projects
- No projects
- No search results
- Project loading error

**Open Questions:**

- Can users rename projects from the dashboard?
- Can users delete projects from the dashboard?
- [Add additional questions]

---

### 4.4 3D Editor

**Purpose:**  
Provide the main workspace for creating and editing a 3D design.

**Main Areas:**

- Editor header / project controls
- Shape palette
- 3D canvas
- Properties / Inspector panel

#### Shape Palette

**Purpose:**  
Allow users to add basic shapes to the design.

**Possible MVP Shapes:**

- Cube
- Sphere
- Cylinder
- [Add agreed shapes]

**Expected Behavior:**

- Selecting a shape adds it to the scene
- Newly added shapes should have default properties

#### 3D Canvas

**Purpose:**  
Display and allow interaction with the user's 3D design.

**Expected Behavior:**

- Render multiple shapes
- Allow selection of an individual shape
- Provide visible feedback for the selected shape
- Allow users to move, rotate, and resize supported shapes

#### Properties / Inspector Panel

**Purpose:**  
Allow users to view and edit properties of the selected object.

**Possible Properties:**

- Position
  - X
  - Y
  - Z
- Rotation
  - X
  - Y
  - Z
- Dimensions / Scale
  - Width
  - Height
  - Depth
- Color

**Expected Behavior:**

- Inspector values reflect the currently selected object
- Updating values changes the selected object
- Changing one object should not unintentionally affect another

**Open Questions:**

- Should dimensions use real-world units such as millimeters?
- Should users manipulate objects directly in the canvas, through numeric inputs, or both?
- How should a new shape be positioned when added?
- Is undo/redo part of the MVP?
- [Add additional questions]

---

## 5. Project Save / Load

### 5.1 Save Project

**Purpose:**  
Allow users to save the current design.

**Main UI Elements:**

- Project name
- Save button
- Cancel button
- Save status / feedback

**Expected Behavior:**

- Save all required project and shape data
- Update an existing project when appropriate
- Show success or failure feedback

**Important States:**

- Saving
- Saved successfully
- Save failed
- Unsaved changes

---

### 5.2 Open Project

**Purpose:**  
Allow users to open an existing saved project.

**Expected Behavior:**

- Retrieve saved project data
- Recreate the project's shapes and properties in the 3D editor
- Display errors if the project cannot be loaded

---

## 6. STL Export

**Purpose:**  
Allow users to export the current design as an STL file.

**Main UI Elements:**

- Export button
- Export modal/dialog
- File name, if required
- Download button

**Expected Behavior:**

- Convert the current supported geometry to STL
- Preserve object geometry and transformations in the exported file
- Download the generated file

**Important States:**

- Exporting
- Export complete
- Export failed
- Empty design

**Open Questions:**

- Should users be allowed to export unsaved projects?
- What should happen if the design is empty?
- [Add additional questions]

---

## 7. Frontend Component Inventory

This is an initial component structure and may change during implementation.

```text
App
├── Header
├── Auth
│   ├── LoginForm
│   └── RegisterForm
│
├── ProjectDashboard
│   ├── ProjectSearch
│   ├── NewProjectButton
│   ├── ProjectList
│   └── ProjectCard
│
└── Editor
    ├── EditorHeader
    ├── ShapePalette
    │   └── ShapeButton
    ├── Canvas3D
    ├── InspectorPanel
    │   ├── PositionControls
    │   ├── RotationControls
    │   ├── DimensionControls
    │   └── ColorControls
    ├── SaveProjectModal
    ├── OpenProjectModal
    └── ExportModal
```

---

## 8. Loading, Empty, Error, and Success States

### Loading States

Examples:

- Loading projects
- Loading saved project
- Saving project
- Exporting STL

### Empty States

Examples:

- User has no saved projects
- Search returns no results
- 3D canvas contains no shapes

### Error States

Examples:

- Login failure
- Registration failure
- Failed project load
- Failed project save
- Failed STL export

### Success States

Examples:

- Project saved successfully
- Project loaded successfully
- STL export completed

---

## 9. Accessibility Considerations

Initial accessibility goals:

- Use semantic HTML where possible
- Provide labels for form controls
- Ensure buttons have clear accessible names
- Maintain visible keyboard focus states
- Support keyboard navigation for standard UI controls
- Use sufficient color contrast
- Avoid relying only on color to communicate state
- Provide understandable error and status messages

3D-specific accessibility requirements may need further discussion.

---

## 10. Responsive Design Considerations

Questions to define:

- What minimum screen width will the MVP support?
- Will the editor be desktop-first?
- How should the Shape Palette and Inspector behave on smaller screens?
- Should side panels collapse or move into drawers?

---

## 11. Frontend / Backend Data Interaction

Examples:

```text
Project Dashboard
       ↓
GET /api/projects
       ↓
Display saved projects
```

```text
Save Project
       ↓
POST or PATCH project data
       ↓
Backend
       ↓
Database
```

```text
Open Project
       ↓
GET project data
       ↓
Frontend state
       ↓
Reconstruct 3D scene
```

Exact API routes should match the team's API documentation.

---

## 12. Open Design Questions

- Which basic shapes are included in the MVP?
- How does the user add a shape to the canvas?
- How are shapes selected?
- How are shapes deleted?
- Are dimensions represented using real-world units?
- Is undo/redo part of the MVP?
- Is autosave required?
- What happens when a user tries to leave with unsaved changes?
- Can projects be renamed or deleted?
- What screen sizes must the editor support?
- Which interactions need to be available by keyboard?
- [Add new questions as they arise]

---

## 13. Design Decisions

Record decisions here as the team agrees on them.

### Decision Template

**Decision:**  
[What was decided]

**Reason:**  
[Why the team chose this approach]

**Date:**  
[Date]

---

## 14. Known Limitations / Out of Scope for MVP

Examples:

- Real-time collaboration
- Advanced CAD constraints
- Complex shape grouping
- Advanced mesh validation
- Google/GitHub OAuth, if not selected
- [Add agreed out-of-scope features]

---

## 15. Revision Notes

| Date       | Change                                           | Author          |
| ---------- | ------------------------------------------------ | --------------- |
| 2026-10-22 | Added table of contents and added to team GitHub | Kelli Chatelain |
| 2026-10-13 | Initial frontend design documentation created    | Kelli Chatelain |
