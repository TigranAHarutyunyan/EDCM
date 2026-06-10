# EDCM հիմնական կոդային բլոկներ և մանրամասն բացատրություն

Այս ֆայլը մեկ տեղում հավաքում է նախագծի ամենակարևոր կոդային հատվածները և բացատրում է, թե ինչպես է աշխատում EDCM համակարգը։ Նպատակը ամբողջ source code-ը կրկնելը չէ, այլ ցույց տալ այն բլոկները, որոնցով հասկացվում են համակարգի հիմնական գաղափարները՝ տվյալների մոդել, API, թույլտվություններ, authentication, routing և frontend կապը backend-ի հետ։

## 1. Նախագծի ընդհանուր ճարտարապետություն

EDCM-ը կառուցված է այս հիմնական մասերից.

```text
React Frontend  ->  Django REST API  ->  PostgreSQL Database
                       |
                       +-> Media files / Attachments
```

Frontend-ը օգտվողին ցույց է տալիս էջերը, ֆորմաները և աղյուսակները։ Django REST API-ն ընդունում է հարցումները, ստուգում է օգտվողի իրավասությունը, աշխատում է database-ի հետ և վերադարձնում JSON տվյալներ։ PostgreSQL-ը պահում է փաստաթղթերը, օգտվողներին, բաժինները, մեկնաբանությունները, audit log-ը և ծանուցումները։

## 2. Django settings. համակարգի կոնֆիգուրացիա

Աղբյուր՝ `config/settings.py`

```python
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "rest_framework",
    "rest_framework.authtoken",
    "corsheaders",
    "documents",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "documents.middleware.DepartmentGateMiddleware",
]

STATIC_URL = "/static/"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
```

Բացատրություն.

`INSTALLED_APPS`-ում միացված են Django-ի հիմնական app-երը, Django REST Framework-ը, token authentication-ը և նախագծի հիմնական `documents` app-ը։ Այս app-ն է պահում մոդելները, serializers-ը, API views-ը և business logic-ի մեծ մասը։

`MIDDLEWARE`-ը request-ի մշակման շերտերի հերթականությունն է։ Այստեղ կարևոր են `CsrfViewMiddleware`-ը, որը պաշտպանում է unsafe request-ները, `AuthenticationMiddleware`-ը, որը request-ին կցում է օգտվողին, և `DepartmentGateMiddleware`-ը, որը նախագծային custom ստուգում է բաժինների հասանելիության համար։

`MEDIA_URL` և `MEDIA_ROOT` կարգավորումները անհրաժեշտ են կցված ֆայլերի համար։ Երբ օգտվողը կամ portal client-ը ֆայլ է upload անում, ֆայլը պահվում է `media` հատվածում, իսկ database-ում պահվում է դրա reference-ը։

## 3. Տվյալների հիմնական մոդելները

Աղբյուր՝ `documents/models.py`

```python
class Department(models.Model):
    name = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True, null=True)


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ("Employee", "Employee"),
        ("Manager", "Manager"),
        ("Department Chef", "Department Chef"),
        ("Admin", "Admin"),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="Employee")
    full_name = models.CharField(max_length=150, blank=True)
    position = models.CharField(max_length=150, blank=True)
```

Բացատրություն.

`Department` մոդելը ներկայացնում է կազմակերպության բաժինները։ Յուրաքանչյուր փաստաթուղթ և շատ օգտվողներ կարող են կապված լինել բաժնի հետ։

`UserProfile` մոդելը լրացնում է Django-ի ստանդարտ `User` մոդելը։ Django-ի `User`-ը պահում է username, email, password և permission flag-երը, իսկ `UserProfile`-ը պահում է business տվյալներ՝ դեր, բաժին, անուն, պաշտոն, նկար և bio։ Սա կարևոր է, որովհետև համակարգի հասանելիության կանոնները հիմնականում որոշվում են `role` և `department` դաշտերով։

```python
class Document(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    document_type = models.ForeignKey(DocumentType, on_delete=models.PROTECT)
    status = models.ForeignKey(DocumentStatus, on_delete=models.PROTECT)
    confidentiality_level = models.ForeignKey(
        ConfidentialityLevel,
        on_delete=models.PROTECT,
        null=True,
        blank=True,
    )
    creator = models.ForeignKey(User, on_delete=models.PROTECT, related_name="created_documents")
    current_owner = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

Բացատրություն.

`Document`-ը համակարգի կենտրոնական մոդելն է։ Այն պահում է փաստաթղթի վերնագիրը, նկարագրությունը, տեսակը, կարգավիճակը, գաղտնիության մակարդակը, ստեղծողին, ընթացիկ պատասխանատուին, բաժինը և deadline-ը։

`creator` դաշտը ցույց է տալիս, թե ով է ստեղծել փաստաթուղթը։ `assigned_to` դաշտը ցույց է տալիս, թե ով է այժմ աշխատում դրա վրա։ `department` դաշտը օգտագործվում է բաժնային ֆիլտրացիայի և manager/department chef logic-ի համար։

```python
class DocumentComment(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    is_external = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="audit_logs")
    action = models.CharField(max_length=100)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True, null=True)
```

Բացատրություն.
d
`DocumentComment`-ը պահում է փաստաթղթի մեկնաբանությունները։ `is_external=True` նշանակում է, որ այդ մեկնաբանությունը կարող է երևալ client portal-ում։

`AuditLog`-ը պահում է փաստաթղթի պատմությունը՝ ով ինչ գործողություն է արել։ Օրինակ՝ փաստաթուղթը վերցնելը, status փոխելը, assignment փոխելը կամ comment ավելացնելը։

```python
class DocumentAttachment(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to=document_attachment_upload_to)
    original_name = models.CharField(max_length=255, blank=True)
    content_type = models.CharField(max_length=100, blank=True)
    size = models.PositiveIntegerField(default=0)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
```

Բացատրություն.

`DocumentAttachment`-ը պահում է փաստաթղթին կցված ֆայլերը։ Ֆայլի իրական բովանդակությունը պահվում է filesystem-ում, իսկ database-ում պահվում են ֆայլի path-ը, անունը, տեսակը, չափը և upload արած օգտվողը։

## 4. User profile signal-ներ

Աղբյուր՝ `documents/models.py`

```python
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        role = "Admin" if instance.is_superuser else "Employee"
        UserProfile.objects.get_or_create(user=instance, defaults={"role": role})


@receiver(post_save, sender=UserProfile)
def sync_user_admin_flags(sender, instance, **kwargs):
    user = instance.user

    if user.is_superuser and instance.role != "Admin":
        UserProfile.objects.filter(pk=instance.pk).update(role="Admin")
        return

    if user.is_superuser:
        if not user.is_staff:
            User.objects.filter(pk=user.pk).update(is_staff=True)
        return

    should_be_staff = instance.role in ("Admin",)
    if user.is_staff != should_be_staff or user.is_superuser:
        User.objects.filter(pk=user.pk).update(
            is_staff=should_be_staff,
            is_superuser=False,
        )
```

Բացատրություն.

Առաջին signal-ը ավտոմատ ստեղծում է `UserProfile`, երբ ստեղծվում է նոր Django `User`։ Սա կանխում է այն սխալները, երբ user-ը կա, բայց profile-ը չկա։

Երկրորդ signal-ը համաժամեցնում է business role-ը Django admin flag-երի հետ։ Եթե օգտվողը `Admin` role ունի, նա կարող է դառնալ staff։ Բայց սովորական role-ը ինքնուրույն չի դարձնում user-ին superuser։ Սա անվտանգության կարևոր կանոն է։

## 5. API access rule. ով կարող է տեսնել փաստաթուղթը

Աղբյուր՝ `documents/api_views.py`

```python
def _user_can_access_document(user, document):
    if not user or not user.is_authenticated:
        return False

    if user.is_superuser or user.is_staff:
        return True

    role = getattr(getattr(user, "profile", None), "role", None)
    if role == "Admin":
        return True

    dept_id = getattr(getattr(user, "profile", None), "department_id", None)
    if dept_id and document.department_id == dept_id:
        return True

    if document.creator_id == user.id:
        return True

    if document.assigned_to_id == user.id:
        return True

    return False
```

Բացատրություն.

Սա փաստաթղթի հասանելիության հիմնական կանոնն է։ User-ը կարող է տեսնել փաստաթուղթը, եթե նա superuser/staff է, ունի Admin role, նույն բաժնից է, փաստաթղթի creator-ն է կամ assigned user-ն է։

Այս ֆունկցիան կարևոր է, որովհետև նույն permission logic-ը կարելի է օգտագործել տարբեր endpoint-ներում՝ detail view, attachment upload/delete, take action և այլն։

## 6. Login և cookie authentication

Աղբյուր՝ `documents/api_views.py`

```python
class CustomAuthToken(ObtainAuthToken):
    authentication_classes = []

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]
        token, created = Token.objects.get_or_create(user=user)

        resp = Response({
            "token": token.key,
            "user_id": user.pk,
            "username": user.username,
            "email": user.email,
            "role": user.profile.role if hasattr(user, "profile") else "Employee",
            "is_staff": user.is_staff,
            "is_superuser": user.is_superuser,
        })

        resp.set_cookie(
            "edcm_auth",
            token.key,
            httponly=True,
            secure=not settings.DEBUG,
            samesite="Lax",
            max_age=60 * 60 * 24 * 7,
            path="/",
        )
        return resp
```

Բացատրություն.

Login endpoint-ը ստուգում է username/password-ը, ստեղծում կամ գտնում է token-ը և այն վերադարձնում է response-ում։ Ավելի կարևոր մասը `set_cookie`-ն է․ token-ը պահվում է `HttpOnly` cookie-ում։

`HttpOnly` cookie-ն frontend JavaScript-ով ուղիղ կարդալ չի լինում, ինչը ավելի անվտանգ է, քան token-ը միայն `localStorage`-ում պահելը։ Frontend-ը request ուղարկելիս cookie-ն ավտոմատ ուղարկվում է, որովհետև axios-ում միացված է `withCredentials`։

## 7. Փաստաթղթերի list/create API

Աղբյուր՝ `documents/api_views.py`

```python
class DocumentListCreateView(generics.ListCreateAPIView):
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user

        if user.is_staff:
            queryset = Document.objects.all()
        elif hasattr(user, "profile") and user.profile.department:
            queryset = Document.objects.filter(
                Q(department=user.profile.department) |
                Q(creator=user) |
                Q(assigned_to=user)
            ).distinct()
        else:
            queryset = Document.objects.filter(
                Q(creator=user) | Q(assigned_to=user)
            ).distinct()

        owner = self.request.query_params.get("owner")
        if owner == "me":
            queryset = Document.objects.filter(
                Q(creator=user) | Q(assigned_to=user)
            ).distinct()

        return queryset.order_by("-created_at")

    def perform_create(self, serializer):
        user = self.request.user
        department = user.profile.department if hasattr(user, "profile") else None
        status_draft, _ = DocumentStatus.objects.get_or_create(
            code="DRAFT",
            defaults={"name": "Draft"},
        )

        serializer.save(
            creator=user,
            current_owner=user,
            department=department,
            status=status_draft,
        )
```

Բացատրություն.

`get_queryset`-ը որոշում է, թե որ փաստաթղթերն են երևալու տվյալ user-ին։ Staff user-ը տեսնում է բոլորը։ Բաժին ունեցող user-ը տեսնում է իր բաժնի, իր ստեղծած կամ իրեն assigned փաստաթղթերը։ Եթե user-ը բաժին չունի, տեսնում է միայն իր ստեղծած կամ իրեն assigned փաստաթղթերը։

`perform_create`-ը փաստաթուղթ ստեղծելիս ավտոմատ լրացնում է creator, current_owner, department և default draft status դաշտերը։ Սա frontend-ին ազատում է այդ արժեքները ձեռքով ուղարկելուց և պահում է business կանոնը backend-ում։

## 8. Փաստաթուղթը վերցնելու action

Աղբյուր՝ `documents/api_views.py`

```python
class DocumentTakeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, pk):
        document = Document.objects.get(pk=pk)
        user = request.user

        _require_document_access(user, document)

        if document.assigned_to and document.assigned_to != user:
            return Response(
                {"error": f"Document already taken by {document.assigned_to.username}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        document.assigned_to = user
        document.save()

        AuditLog.objects.create(
            user=user,
            document=document,
            action="Taken",
            details=f"Document taken by {user.username}",
        )

        return Response(DocumentSerializer(document).data)
```

Բացատրություն.

Այս endpoint-ը թույլ է տալիս user-ին «վերցնել» փաստաթուղթը։ Նախ ստուգվում է, որ user-ը հասանելիություն ունի փաստաթղթին։ Հետո ստուգվում է՝ արդյոք փաստաթուղթն արդեն ուրիշ user-ի assigned չէ։ Եթե ազատ է կամ արդեն տվյալ user-ին է assigned, դաշտը թարմացվում է և ստեղծվում է audit log։

Սա workflow-ի կարևոր բլոկ է, որովհետև document-ը չպետք է միաժամանակ մի քանի աշխատողի կողմից վերցված լինի։

## 9. Serializer. model-ը JSON-ի վերածելու շերտ

Աղբյուր՝ `documents/serializers.py`

```python
class DocumentSerializer(serializers.ModelSerializer):
    creator = UserSerializer(read_only=True)
    current_owner = UserSerializer(read_only=True)
    department = DepartmentSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    document_type_details = DocumentTypeSerializer(source="document_type", read_only=True)
    status_details = DocumentStatusSerializer(source="status", read_only=True)
    comments = DocumentCommentSerializer(many=True, read_only=True)
    history = AuditLogSerializer(source="audit_logs", many=True, read_only=True)
    attachments = DocumentAttachmentSerializer(many=True, read_only=True)

    document_type = serializers.PrimaryKeyRelatedField(
        queryset=DocumentType.objects.all(),
        write_only=True,
        required=False,
    )
    assigned_to_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="assigned_to",
        write_only=True,
        required=False,
        allow_null=True,
    )
```

Բացատրություն.

Serializer-ը որոշում է, թե API-ն ինչ JSON է վերադարձնում և ինչ input է ընդունում։ Read-only դաշտերը frontend-ին վերադարձնում են ամբողջական nested տվյալներ՝ creator, department, status details, comments, history, attachments։ Write-only դաշտերը frontend-ից ընդունում են միայն ID-ներ՝ օրինակ `document_type` կամ `assigned_to_id`։

Սա լավ մոտեցում է, որովհետև frontend-ը ցուցադրելու համար ստանում է հարուստ object, բայց create/update անելիս ուղարկում է պարզ ID։

```python
def update(self, instance, validated_data):
    request = self.context.get("request")
    user = getattr(request, "user", None)
    role = getattr(getattr(user, "profile", None), "role", None) if user else None

    if "assigned_to" in validated_data:
        can_reassign = bool(
            user and (user.is_superuser or role in ("Admin", "Department Chef", "Manager"))
        )
        if not can_reassign:
            validated_data.pop("assigned_to", None)

    if "status" in validated_data:
        can_update_status = bool(
            user and (
                user.is_superuser
                or role in ("Admin", "Department Chef", "Manager")
                or instance.creator_id == user.id
                or instance.assigned_to_id == user.id
            )
        )
        if not can_update_status:
            validated_data.pop("status", None)

    return super().update(instance, validated_data)
```

Բացատրություն.

Այս բլոկը update-ի ժամանակ պաշտպանում է կարևոր դաշտերը։ Ամեն user չի կարող փաստաթուղթը reassign անել կամ status փոխել։ Reassign կարող են անել superuser, Admin, Department Chef կամ Manager։ Status փոխել կարող են նաև creator-ը և assigned user-ը։

Այսպիսի validation-ը կարևոր է serializer-ում, որովհետև նույնիսկ եթե frontend-ը թաքցնում է որոշ button-ներ, չարամիտ կամ սխալ client-ը կարող է API-ին ուղիղ request ուղարկել։

## 10. Public portal submit

Աղբյուր՝ `documents/api_views.py`

```python
class PortalSubmitView(APIView):
    permission_classes = [permissions.AllowAny]
    authentication_classes = []
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        title = (request.data.get("title") or "").strip()
        description = (request.data.get("description") or "").strip()

        if not title:
            raise ValidationError({"title": "This field is required."})

        inbox_user = _get_portal_inbox_user()

        doc_type, _ = DocumentType.objects.get_or_create(
            code="REQUEST",
            defaults={"name": "Request"},
        )
        pending_status, _ = DocumentStatus.objects.get_or_create(
            code="PENDING",
            defaults={"name": "Pending Approval"},
        )
        public_level, _ = ConfidentialityLevel.objects.get_or_create(
            code="PUBLIC",
            defaults={"name": "Public"},
        )

        document = Document.objects.create(
            title=title,
            description=description,
            document_type=doc_type,
            status=pending_status,
            confidentiality_level=public_level,
            creator=inbox_user,
            current_owner=inbox_user,
            assigned_to=inbox_user,
            department=None,
        )

        PortalSubmission.objects.create(document=document)
        return Response({"id": document.id, "message": "Submitted successfully"}, status=201)
```

Բացատրություն.

Սա արտաքին հաճախորդի համար public endpoint է։ Այստեղ authentication պետք չէ, որովհետև client-ը կարող է portal-ից փաստաթուղթ ուղարկել առանց համակարգի ներքին account ունենալու։

Endpoint-ը ստեղծում է փաստաթուղթ default արժեքներով՝ type=`REQUEST`, status=`PENDING`, confidentiality=`PUBLIC`։ Ստեղծված փաստաթուղթը assigned է լինում portal inbox user-ին, օրինակ `admin` կամ env variable-ով նշված dispatcher user-ին։

## 11. API URL routing

Աղբյուր՝ `documents/api_urls.py`

```python
urlpatterns = [
    path("csrf/", CsrfView.as_view(), name="api_csrf"),
    path("auth/me/", MeView.as_view(), name="api_me"),
    path("auth/login/", CustomAuthToken.as_view(), name="api_login"),
    path("auth/logout/", LogoutView.as_view(), name="api_logout"),

    path("dashboard/", DashboardStatsView.as_view(), name="api_dashboard"),
    path("documents/", DocumentListCreateView.as_view(), name="api_document_list"),
    path("documents/<int:pk>/", DocumentDetailView.as_view(), name="api_document_detail"),
    path("documents/<int:pk>/take/", DocumentTakeView.as_view(), name="api_document_take"),
    path("documents/<int:pk>/comment/", DocumentCommentCreateView.as_view(), name="api_document_comment"),
    path("documents/<int:pk>/attachments/", DocumentAttachmentListCreateView.as_view(), name="api_document_attachments"),

    path("portal/submit/", PortalSubmitView.as_view(), name="api_portal_submit"),
    path("portal/inbox/", PortalInboxListView.as_view(), name="api_portal_inbox"),
    path("portal/sync-status/", PortalStatusSyncView.as_view(), name="api_portal_status_sync"),
]
```

Բացատրություն.

Այս ֆայլը կապում է URL-ները համապատասխան view class-երի հետ։ Օրինակ՝ frontend-ը `/api/documents/` հարցում է ուղարկում, Django-ն այն ուղարկում է `DocumentListCreateView` class-ին։

URL routing-ը API-ի քարտեզն է։ Եթե ուզում եք հասկանալ, թե ինչ endpoint-ներ կան համակարգում, առաջինը պետք է նայել այս ֆայլը։

## 12. Frontend axios API client

Աղբյուր՝ `frontend/src/services/api.js`

```javascript
import axios from "axios";

const api = axios.create({
  baseURL: "/api/",
  withCredentials: true,
  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",
});

export default api;
```

Բացատրություն.

Սա frontend-ի կենտրոնական API client-ն է։ `baseURL: "/api/"` նշանակում է, որ `api.get("documents/")` իրականում գնում է `/api/documents/`։

`withCredentials: true`-ը ստիպում է browser-ին request-ների հետ ուղարկել cookie-ները, այդ թվում՝ `edcm_auth` authentication cookie-ն։

`xsrfCookieName` և `xsrfHeaderName` դաշտերը օգնում են CSRF պաշտպանությանը։ Axios-ը կարդում է `csrftoken` cookie-ն և unsafe method-ների համար դնում է `X-CSRFToken` header։

## 13. Frontend AuthProvider

Աղբյուր՝ `frontend/src/context/AuthProvider.jsx`

```javascript
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("csrf/").catch(() => {});

    const loadMe = async () => {
      try {
        const meRes = await api.get("auth/me/");
        localStorage.setItem("user", JSON.stringify(meRes.data));
        setUser(meRes.data);
      } catch {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) setUser(storedUser);
      } finally {
        setLoading(false);
      }
    };

    loadMe();
  }, []);

  const login = async (username, password) => {
    const response = await api.post("auth/login/", { username, password });
    const { token: _TOKEN, ...userData } = response.data;
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    return userData;
  };
```

Բացատրություն.

`AuthProvider`-ը պահում է ընթացիկ user-ի վիճակը React state-ում։ Երբ app-ը բացվում է, այն նախ կանչում է `csrf/`, որ browser-ը ստանա CSRF cookie։ Հետո կանչում է `auth/me/`, որպեսզի backend-ից ստանա ընթացիկ user-ին։

Login-ի ժամանակ frontend-ը username/password է ուղարկում backend-ին։ Backend-ը cookie է դնում, իսկ frontend-ը state-ում պահում է user-ի տվյալները։ Token-ը response-ից հանվում է և չի օգտագործվում React state-ում որպես հիմնական auth storage։

## 14. ProtectedRoute

Աղբյուր՝ `frontend/src/components/ProtectedRoute.jsx`

```javascript
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
};
```

Բացատրություն.

Այս component-ը պաշտպանում է private էջերը։ Եթե authentication-ը դեռ ստուգվում է, ցույց է տալիս loading։ Եթե user չկա, redirect է անում `/login`։ Եթե user կա, ցույց է տալիս nested route-ը՝ `Outlet`-ի միջոցով։

Այսպես dashboard, documents, profile և notifications էջերը չեն բացվում առանց login-ի։

## 15. Frontend route map

Աղբյուր՝ `frontend/src/App.jsx`

```javascript
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/portal" element={<Portal />} />

  <Route element={<ProtectedRoute />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/documents" element={<Documents />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/notifications" element={<Notifications />} />
    <Route path="/department/*" element={<DepartmentPanel />} />
  </Route>
</Routes>
```

Բացատրություն.

`/login` և `/portal` public էջեր են։ `/portal`-ը նախատեսված է արտաքին հաճախորդների համար, իսկ `/login`-ը՝ ներքին օգտվողների մուտքի համար։

Մնացած էջերը գտնվում են `ProtectedRoute`-ի ներսում։ Դա նշանակում է, որ դրանք հասանելի են միայն authenticated user-ին։

## 16. Հիմնական request հոսք

Օրինակ՝ user-ը բացում է Documents էջը.

```text
1. React page-ը կանչում է api.get("documents/")
2. Axios-ը request է ուղարկում /api/documents/
3. Browser-ը request-ի հետ ուղարկում է edcm_auth cookie-ն
4. Django authentication-ը գտնում է user-ին
5. DocumentListCreateView.get_queryset()-ը ֆիլտրում է փաստաթղթերը ըստ user-ի դերի և բաժնի
6. DocumentSerializer-ը model object-ները դարձնում է JSON
7. React-ը ստացված JSON-ը ցույց է տալիս UI-ում
```

Սա backend/frontend ինտեգրման հիմնական տրամաբանությունն է։

## 17. Ամենակարևոր business կանոնները

```text
Admin / staff
  Կարող է տեսնել գրեթե բոլոր փաստաթղթերը և կառավարել համակարգը։

Manager
  Կարող է տեսնել իր բաժնի փաստաթղթերը և կառավարել բաժնի ներսի աշխատանքը։

Employee
  Հիմնականում տեսնում է իր ստեղծած, իրեն assigned կամ իր բաժնի հասանելի փաստաթղթերը։

Portal client
  Account չունի։ Կարող է public portal-ից փաստաթուղթ ուղարկել և status ստուգել email-ով։
```

Այս կանոնները իրականացվում են ոչ միայն frontend-ում, այլ նաև backend-ում։ Դա կարևոր է, որովհետև իրական անվտանգությունը պետք է լինի backend-ում։

## 18. Կարճ ամփոփում

EDCM-ի առանցքային հիմքը հետևյալն է.

```text
models.py       -> նկարագրում է database-ի կառուցվածքը
serializers.py  -> model-ները վերածում է JSON-ի և ստուգում update/create input-ը
api_views.py    -> պահում է API-ի հիմնական business logic-ը
api_urls.py     -> URL-ները կապում է API view-երի հետ
api.js          -> frontend-ի կենտրոնական HTTP client-ն է
AuthProvider    -> պահում է login state-ը React-ում
ProtectedRoute  -> պաշտպանում է private էջերը
App.jsx         -> նկարագրում է frontend route-երը
```

Եթե պետք է արագ հասկանալ նախագիծը, կարդալու լավագույն հերթականությունը սա է.

```text
1. README.md
2. documents/models.py
3. documents/serializers.py
4. documents/api_views.py
5. documents/api_urls.py
6. frontend/src/services/api.js
7. frontend/src/context/AuthProvider.jsx
8. frontend/src/App.jsx
```
