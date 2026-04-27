Place Rive animation files for runtime loading here.

Expected file for the review right panel:
- `cat-scanner.riv` (or rename your uploaded `cat.riv` to this filename)

Current integration in `DocumentReviewRightPanel` expects:
- Artboard: `CatLoader`
- Waiting timeline (idle before scan click): `Timeline 1`
- Scanning timeline (after scan click): `Timeline 2`
- Optional layer target (code-first call): `Tail layer`

If your names differ, update the constants at the top of:
- `frontend/src/components/DocumentReviewRightPanel.jsx`
