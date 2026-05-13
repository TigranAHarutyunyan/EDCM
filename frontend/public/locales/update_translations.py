import json
import os

locales = {
    "en": "/Users/tigran/Desktop/EDCM/frontend/public/locales/en/translation.json",
    "ru": "/Users/tigran/Desktop/EDCM/frontend/public/locales/ru/translation.json",
    "hy": "/Users/tigran/Desktop/EDCM/frontend/public/locales/hy/translation.json"
}

updates_en = {
    "common": {
        "all": "All",
        "id": "ID",
        "title": "Title",
        "status": "Status",
        "type": "Type",
        "created": "Created",
        "assignedTo": "Assigned To",
        "view": "View",
        "na": "N/A"
    },
    "nav": {
        "loggedInAs": "Logged in as"
    },
    "dashboard": {
        "overview": "Overview of your document activities",
        "adminPanel": "Admin Panel",
        "departmentPanel": "Department Panel",
        "searchPlaceholder": "View Document by ID...",
        "docNotFound": "Document not found",
        "fetchError": "Error fetching document",
        "newDocument": "New Document",
        "startWorkflow": "Start a new document workflow",
        "createNew": "+ Create New",
        "portalInbox": "Portal Inbox",
        "unassigned": "Unassigned",
        "noDocuments": "No documents found. start by creating one!"
    }
}

updates_ru = {
    "common": {
        "all": "Все",
        "id": "ID",
        "title": "Заголовок",
        "status": "Статус",
        "type": "Тип",
        "created": "Создан",
        "assignedTo": "Назначен",
        "view": "Посмотреть",
        "na": "Н/Д"
    },
    "nav": {
        "loggedInAs": "Вы вошли как"
    },
    "dashboard": {
        "overview": "Обзор ваших действий с документами",
        "adminPanel": "Панель администратора",
        "departmentPanel": "Панель отдела",
        "searchPlaceholder": "Поиск по ID...",
        "docNotFound": "Документ не найден",
        "fetchError": "Ошибка получения документа",
        "newDocument": "Новый документ",
        "startWorkflow": "Начать новый процесс",
        "createNew": "+ Создать",
        "portalInbox": "Входящие портала",
        "unassigned": "Не назначено",
        "noDocuments": "Документы не найдены. Создайте первый!"
    }
}

updates_hy = {
    "common": {
        "all": "Բոլորը",
        "id": "ID",
        "title": "Վերնագիր",
        "status": "Կարգավիճակ",
        "type": "Տեսակ",
        "created": "Ստեղծված է",
        "assignedTo": "Կցված է",
        "view": "Դիտել",
        "na": "Անհասանելի"
    },
    "nav": {
        "loggedInAs": "Մուտք գործած որպես"
    },
    "dashboard": {
        "overview": "Ձեր փաստաթղթերի ակնարկ",
        "adminPanel": "Ադմինի վահանակ",
        "departmentPanel": "Բաժնի վահանակ",
        "searchPlaceholder": "Դիտել փաստաթուղթը ըստ ID...",
        "docNotFound": "Փաստաթուղթը չի գտնվել",
        "fetchError": "Սխալ փաստաթուղթը բեռնելիս",
        "newDocument": "Նոր փաստաթուղթ",
        "startWorkflow": "Սկսել նոր գործընթաց",
        "createNew": "+ Ստեղծել նոր",
        "portalInbox": "Պորտալի մուտքային",
        "unassigned": "Չկցված",
        "noDocuments": "Փաստաթղթեր չեն գտնվել: Սկսեք ստեղծելով նորը!"
    }
}

all_updates = {
    "en": updates_en,
    "ru": updates_ru,
    "hy": updates_hy
}

for lang, filepath in locales.items():
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        updates = all_updates[lang]
        for key, value in updates.items():
            if key not in data:
                data[key] = {}
            for sub_key, sub_value in value.items():
                if sub_key not in data[key]:
                    data[key][sub_key] = sub_value
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Updated {lang}")
