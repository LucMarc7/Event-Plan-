# API CONTRACT — Event Plan

> Source de vérité : ce document décrit **exactement** ce que le backend expose.
> Toute modification côté mobile DOIT être alignée ici d'abord.

Backend prod : `https://klmarc.pythonanywhere.com`
Header obligatoire mobile : `X-Client-Channel: mobile`

---

## 1. Deux cycles d'auth distincts

| Rôle           | Login                    | Storage token                                         | Durée            |
| -------------- | ------------------------ | ----------------------------------------------------- | ---------------- |
| **Organizer**  | `POST /accounts/login/`  | `authToken` + `refresh` (SecureStore)                 | 15 min / 7 jours |
| **Controller** | `POST /controles/login/` | `controllerToken` + `controllerRefresh` (SecureStore) | 24 h / 7 jours   |

Le JWT contrôleur contient les claims custom :

- `role: "controller"`
- `event_id: "<uuid>"`

Le contrôleur **ne peut pas** appeler `/events/` (permission refusée).

---

## 2. Auth Organizer

### POST /accounts/login/

Body: `{ username, password }`
Réponse 200 :
{
"access": "eyJ...",
"refresh": "eyJ...",
"user": {
"id": 1, "username", "email", "first_name", "last_name",
"role": "organizer|buyer|admin", "category",
"can_create_unlimited_events": true,
"profile": { "profile_image": "/media/..." }
}
}
Erreurs : 401 `{ "detail" }`, 400 validation

### POST /accounts/register/

Body: `{ username, email, first_name, last_name, password, password2, userprofile: { country, city, address } }`

### POST /accounts/logout/

Body: `{ refresh }`

### POST /accounts/token/refresh/

Body: `{ refresh }` → `{ access }`

### GET /accounts/profile/

Réponse : `{ id, first_name, last_name, email, profile_image_url, country, city, address, role, category, can_create_unlimited_events }`

### POST /accounts/change_password/

Body: `{ old_password, new_password, confirm_password }`
⚠️ 3 champs obligatoires

### POST /accounts/profile/avatar/

Multipart: `avatar` (max 5 Mo, image/\*)

### DELETE /accounts/profile/avatar/

---

## 3. Auth Contrôleur

### POST /controles/login/

Body: `{ username, password, event_code }`
Rate limit : **5/min par IP** → 429 sinon
Réponse 200 :
{
"access": "eyJ...",
"refresh": "eyJ...",
"user": { "id", "username", "name" },
"event": { "id": "uuid", "name", "event_code", "date", "ville" }
}
Erreurs :

- 400 : validation serializer
- 401 : `{ "error": "Identifiants invalides." }`
- 403 : `{ "error": "Ce compte n'est pas un contrôleur." }` OU `{ "error": "Vous n'êtes pas autorisé à contrôler cet événement." }`
- 404 : `{ "error": "Code événement 'X' invalide." }`
- 429 : `{ "error": "Trop de tentatives...", "retry_after_seconds": 60 }`

### GET /controles/me/

Réponse :
{
"user": { "id", "username", "name" },
"event": { "id", "name", "event_code", "date", "ville", "description" },
"stats": { "total_invitations", "validated_by_me" }
}

### GET /controles/invitations/

Réponse :
{
"event_id": "uuid",
"total": 45,
"invitations": [
{ "id": "uuid", "first_person", "second_person", "place",
"invitation_type": "COUPLE|SINGLETON", "used": false, "code_invit" }
]
}

### POST /controles/validate/

Body: `{ qr_data: { type, event_id, invitation_id|ticket_id, signature, version, ... } }`
`qr_data` = objet JSON décodé du QR scanné.

4 réponses :

| Cas | HTTP | Body |
| --- | --- | --- |
| Valide | 200 | `{ valid: true, status: "validated", message, guest_name, second_person, place, event_name, validated_at }` |
| Déjà scanné | 200 | `{ valid: true, status: "already_validated", message, guest_name, place, validated_at }` |
| Mauvais event | 403 | `{ valid: false, status: "wrong_event", error, other_event_name }` |
| Faux QR | 400 | `{ valid: false, status: "fake", error }` |

---

## 4. Events (organizer)

### GET /events/

Réponse : tableau de `UnifiedEventSerializer`
[{
"id": "uuid", "title": "Mariage Kupa",
"image_url", "image_thumbnail_url", "image_medium_url",
"date": "2026-06-15", "location": "Lubumbashi - Katuba",
"description", "category": "Mariage"
}]

### GET /events/<uuid:pk>/

Réponse : `{ id, title, name, description, date, heure_debut, heure_fin, location, avenue, commune, ville, reference, image_url, event_image_url, event_code, total_access, categories: [...], category, type }`

### POST /events/create/

Content-Type: `multipart/form-data`
Champs : `title`, `description`, `date` (ISO), `location`, `total_access`, `event_category` (Mariage|Birthday|Concert|Conference), `image` (file optionnel), `categories` (JSON string)
Erreur 402 : `{ error, need_subscription: true }`

### POST /events/api/ajout/image/<uuid:event_id>/

Multipart : `event_image`

### GET /events/seller/stats/

Réponse : `{ totalEvents, totalTicketsSold, totalRevenue, totalCommission, netRevenue }`

---

## 5. Event Controllers (organizer → contrôleurs)

### GET /events/<uuid:event_id>/controllers/

Réponse :
{
"event_id", "event_name", "event_code",
"max_controllers": 3, "current_count": 1,
"controllers": [
{ "id", "user_id", "username", "name", "is_active", "created_at" }
]
}

### POST /events/<uuid:event_id>/controllers/

Body : `{ name: "Jean" }`
Réponse 201 :
{
"success": true,
"message": "Contrôleur créé. Transmettez ces identifiants...",
"controller": {
"id", "user_id", "username": "ctrl_jean_a3f2",
"temp_password": "kAb3xP9z", // UNE SEULE FOIS
"name": "Jean"
},
"event": { "id", "name", "event_code" }
}
Erreur 400 : limite atteinte

### DELETE /events/<uuid:event_id>/controllers/<int:user_id>/

Réponse : `{ success: true, message, controller_id, is_active: false }`

### GET /events/<uuid:event_id>/controllers/report/

Réponse :
{
"event": { id, name, event_code, date },
"summary": { total_controllers, active_controllers, total_invitation_validations, total_ticket_validations, total_validations },
"controllers": [
{ user_id, username, name, is_active, created_at,
validations: { invitations, tickets, total },
first_validation_at, last_validation_at }
]
}

---

## 6. Invitations (organizer)

### GET /invitations/api/invitations_list/<event_id>/

Réponse : `[{ id, first_person, second_person, invitation_type, place, email, tel, used, code_invit, qr_code_url, created_date }]`

### POST /invitations/api/create_invitation/<event_id>/

Body : `{ first_person, second_person, invitation_type, place, email, tel }`
(backend génère code_invit + qr_code)

### GET /invitations/api/retrieve_invitation/<invitation_id>/

`invitation_id` = **UUID**

### PUT /invitations/api/update_invitation/<invitation_id>/

### DELETE /invitations/api/delete_invitation/<invitation_id>/

---

## 7. Payments (SerdiPay)

### POST /payments/api/payments/initiate/

### GET /payments/api/payments/serdipay/status/<session_id>/

### POST /payments/api/payments/serdipay/callback/

---

## 8. Header obligatoire

Toute requête mobile DOIT inclure :
X-Client-Channel: mobile

Sinon le middleware `ChannelSecurityMiddleware` peut refuser.

---

## 9. Storage des tokens (mobile)

SecureStore keys :

- `authToken` + `refresh` → organizer
- `controllerToken` + `controllerRefresh` → contrôleur

Le client HTTP choisit selon le préfixe de l'URL :

- URL commence par `/controles/` → utilise controllerToken
- Sinon → utilise authToken
