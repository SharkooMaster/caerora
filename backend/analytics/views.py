from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .serializers import EventIngestSerializer


@api_view(["POST"])
@permission_classes([AllowAny])
def ingest_events(request):
    """Accept a single event or a batch of events from the client tracker."""
    data = request.data
    events = data if isinstance(data, list) else [data]
    created = 0
    errors = []
    for raw in events[:50]:  # cap batch size
        serializer = EventIngestSerializer(data=raw, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            created += 1
        else:
            errors.append(serializer.errors)
    return Response(
        {"created": created, "errors": errors},
        status=status.HTTP_201_CREATED if created else status.HTTP_400_BAD_REQUEST,
    )
