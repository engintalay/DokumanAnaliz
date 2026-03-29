# Document Analysis Web Application - Project Plan

## 1. Overview
- Goal: Build a web app that accepts various document types, runs OCR using chandra-ocr, converts everything to searchable PDF, extracts text, and provides Q&A with source citations.

## 2. High-Level Architecture
- Frontend (React)
- Backend (Node.js + Express or Python + FastAPI)
- OCR Service (chandra-ocr)
- PDF Normalization (pdf-lib)
- Text Extraction & Indexing
- Q&A Engine (LLM API)
- Database (SQLite / MongoDB)

## 3. Technology Choices
- Backend: Node.js (Express)  (or Python? choose one)
- OCR: chandra-ocr (npm package)
- PDF handling: pdf-lib
- Database: SQLite (simple) or MongoDB (scalable)
- LLM: OpenAI API (or local model)

## 4. Detailed Steps
1. Initialize repo, set up folder structure.
2. Choose backend language/framework.
3. Implement OCR integration using chandra-ocr.
4. Build PDF normalization pipeline.
5. Extract text from PDF.
6. Store extracted text and metadata.
7. Develop Q&A endpoint using LLM.
8. Create frontend UI for upload and query.
9. Testing, documentation, deployment.

## 5. Milestones
- Milestone 1: Project scaffolding
- Milestone 2: OCR service functional
- Milestone 3: PDF normalization + text extraction
- Milestone 4: Q&A endpoint
- Milestone 5: Frontend UI
- Milestone 6: Testing & deployment

## 6. Risks & Mitigations
- OCR accuracy variations – use fallback OCR services.
- LLM cost – use token-efficient prompts or local model.