from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.shortcuts import get_object_or_404

from .models import User
from .serializers import (
    UserSerializer, 
    UserRegistrationSerializer, 
    UserLoginSerializer,
    ChangePasswordSerializer
)


class RegisterView(generics.CreateAPIView):
    """User registration view."""
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserRegistrationSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access_token': str(refresh.access_token),
            'token_type': 'bearer',
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    """User login view."""
    permission_classes = [AllowAny]
    serializer_class = UserLoginSerializer
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        username = serializer.validated_data['username']
        password = serializer.validated_data['password']
        
        # Try to authenticate by username
        user = authenticate(request, username=username, password=password)
        
        # If not found, try to find by email
        if user is None:
            try:
                user = User.objects.get(email=username)
                if not check_password(password, user.password):
                    user = None
            except User.DoesNotExist:
                pass
        
        if user is None:
            return Response(
                {'detail': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {'detail': 'Account is inactive'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'access_token': str(refresh.access_token),
            'token_type': 'bearer',
            'user': UserSerializer(user).data
        })


class UserProfileView(generics.RetrieveAPIView):
    """Get current user profile."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    """Change user password."""
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]
    
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        
        # Verify current password
        if not check_password(serializer.validated_data['current_password'], user.password):
            return Response(
                {'detail': 'Current password is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Set new password
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        return Response({'message': 'Password changed successfully'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_balance(request):
    """Get current user's balance."""
    user = request.user
    return Response({
        'username': user.username,
        'payout_balance': float(user.payout_balance),
        'balance': float(user.payout_balance),
        'reviews_completed': user.reviews_done
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_stats(request):
    """Get current user's statistics."""
    from reviews.models import ReviewLog
    
    user = request.user
    
    # Get review stats
    review_logs = ReviewLog.objects.filter(reviewer=user)
    total_reviews = review_logs.count()
    approved_count = review_logs.filter(action='approve').count()
    edited_count = review_logs.filter(action='edit').count()
    skipped_count = review_logs.filter(action='skip').count()
    total_earnings = sum(float(log.payout_amount) for log in review_logs)
    
    return Response({
        'total_reviews': total_reviews,
        'approved': approved_count,
        'edited': edited_count,
        'skipped': skipped_count,
        'total_earnings': total_earnings,
        'payout_balance': float(user.payout_balance),
        'balance': float(user.payout_balance)
    })


class UserRetrieveView(generics.RetrieveAPIView):
    """Get user by username."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'username'


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def request_payout(request):
    """Request a payout."""
    from reviews.models import Payout
    from django.utils import timezone
    
    amount = float(request.data.get('amount', 0))
    payment_method = request.data.get('payment_method', 'bank_transfer')
    payment_details = request.data.get('payment_details', {})
    
    if amount <= 0:
        return Response(
            {'detail': 'Amount must be greater than 0'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = request.user
    
    # Check balance
    if user.payout_balance < amount:
        return Response(
            {'detail': f'Insufficient balance. Available: ${user.payout_balance:.2f}, Requested: ${amount:.2f}'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Create payout
    payout_id = f"payout_{int(timezone.now().timestamp() * 1000)}"
    payout = Payout.objects.create(
        payout_id=payout_id,
        user=user,
        amount=amount,
        payment_method=payment_method,
        payment_details=payment_details
    )
    
    # Deduct from balance
    user.payout_balance -= amount
    user.save(update_fields=['payout_balance'])
    
    return Response({
        'payout_id': payout.payout_id,
        'username': user.username,
        'amount': float(payout.amount),
        'status': payout.status,
        'payment_method': payout.payment_method,
        'requested_at': payout.requested_at.isoformat(),
        'processed_at': payout.processed_at.isoformat() if payout.processed_at else None,
        'notes': payout.notes
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def logout_view(request):
    """Logout view (client should delete token)."""
    return Response({'message': 'Logged out successfully'})
