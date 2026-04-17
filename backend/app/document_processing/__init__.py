"""Document ingestion and parsing abstraction layer.

This package introduces a swappable `DocumentProcessor` interface so we can
benchmark different engines (Gatekeeper, Unstructured, Marker, etc.) without
changing the API contract.
"""

