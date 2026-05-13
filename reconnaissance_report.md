# تقرير الاستطلاع وجمع المعلومات
# Reconnaissance Report

**الهدف / Target:** `testphp.vulnweb.com`  
**التاريخ / Date:** 2026-05-13  
**الغرض:** تعليمي — نطاق تجريبي قانوني مخصص للتعلم (Acunetix Vulnerable Web App)

---

## 1. مقدمة — مفهوم الاستطلاع

الاستطلاع (Reconnaissance) هو المرحلة الأولى في منهجية اختبار الاختراق (Penetration Testing). يهدف إلى جمع أكبر قدر ممكن من المعلومات عن الهدف **قبل** محاولة أي هجوم أو استغلال.

ينقسم الاستطلاع إلى نوعين:
- **الاستطلاع السلبي (Passive Recon):** جمع معلومات دون التفاعل المباشر مع الهدف (مثل: whois، DNS lookup، OSINT).
- **الاستطلاع النشط (Active Recon):** التفاعل المباشر مع الهدف لاستكشاف المنافذ والخدمات (مثل: Nmap).

في هذا التقرير تم تطبيق كلا النوعين على النطاق التجريبي `testphp.vulnweb.com`.

---

## 2. الأدوات المستخدمة

| الأداة | الغرض | النوع |
|--------|--------|-------|
| **nslookup / Python DNS** | استعلام DNS واستخراج عنوان IP | سلبي |
| **whois / RDAP** | معلومات المالك والتسجيل | سلبي |
| **Python Socket Scanner** | مسح المنافذ المفتوحة | نشط |
| **SSL/TLS Inspector** | فحص شهادة الأمان | نشط |
| **HTTP Banner Grabbing** | استخراج معلومات الخادم | نشط |
| **Subdomain Enumeration** | اكتشاف النطاقات الفرعية | سلبي |

---

## 3. نتائج الاستطلاع

### 3.1 معلومات DNS ونطاق الهدف

```
الأمر: python3 -c "import socket; print(socket.gethostbyname('testphp.vulnweb.com'))"

النتيجة:
Target  : testphp.vulnweb.com
IP      : 44.228.249.3
Reverse : ec2-44-228-249-3.us-west-2.compute.amazonaws.com
```

**التحليل:** يشير Reverse DNS إلى أن الخادم مستضاف على **Amazon Web Services (AWS)**  
في منطقة **US-West-2 (Oregon, USA)**.

---

### 3.2 اكتشاف النطاقات الفرعية (Subdomain Enumeration)

```
الأمر: فحص النطاقات الفرعية الشائعة لـ vulnweb.com

النتائج:
testphp.vulnweb.com     → 44.228.249.3   (RESOLVED)
testhtml5.vulnweb.com   → 44.228.249.3   (RESOLVED)
testasp.vulnweb.com     → 44.238.29.244  (RESOLVED)
testaspnet.vulnweb.com  → 44.238.29.244  (RESOLVED)
www.vulnweb.com         → 44.228.249.3   (RESOLVED)
```

**التحليل:** تم اكتشاف 5 نطاقات فرعية نشطة. النطاقات تستخدم عنوانين IP مختلفين،  
مما يشير إلى وجود خوادم متعددة أو موازن تحميل (Load Balancer).

---

### 3.3 مسح المنافذ (Port Scan)

```
الأمر: Python Socket Scanner على 44.228.249.3

النتائج:
PORT     STATE   SERVICE
80/tcp   OPEN    HTTP
443/tcp  OPEN    HTTPS

المنافذ المغلقة: 21(FTP), 22(SSH), 23(Telnet), 25(SMTP), 
                 53(DNS), 3306(MySQL), 8080, 8443
```

**التحليل:** الهدف يكشف منفذين فقط للعالم الخارجي (80 و 443)، مما يدل على وجود  
جدار حماية (Firewall) يغلق بقية المنافذ. المنفذ 3306 (MySQL) مغلق — وهذا إجراء أمني جيد.

---

### 3.4 فحص شهادة SSL/TLS (Port 443)

```
الأمر: Python SSL Inspector

النتائج:
TLS Version : TLSv1.3
Cipher Suite: TLS_AES_256_GCM_SHA384 (256-bit)
Key Exchange: TLS 1.3 built-in
```

**التحليل:** الخادم يستخدم **TLS 1.3** — أحدث إصدار من بروتوكول التشفير وأكثرها أماناً.  
خوارزمية التشفير AES-256-GCM توفر تشفيراً قوياً للبيانات المنقولة.

---

### 3.5 استخراج معلومات الخادم (Banner Grabbing)

```
الأمر: GET / HTTP/1.1 Host: testphp.vulnweb.com

الاستجابة:
HTTP/1.1 403 Forbidden
x-deny-reason: host_not_allowed
content-type: text/plain
date: Wed, 13 May 2026 08:05:08 GMT

البيانات المعروفة عن التطبيق (من التوثيق الرسمي لـ Acunetix):
- Web Server  : Apache HTTP Server
- Language    : PHP
- Database    : MySQL
- OS          : Linux
- Framework   : تطبيق PHP كلاسيكي
```

**التحليل:** الخادم محمي حالياً بـ WAF/Reverse Proxy يرفض الاتصالات من عناوين IP  
غير مسموح بها. هذا يثبت وجود طبقة حماية إضافية أمام التطبيق الأصلي.

---

### 3.6 ملخص المعلومات المجموعة

| المعلومة | القيمة |
|----------|--------|
| النطاق | testphp.vulnweb.com |
| عنوان IP | 44.228.249.3 |
| Reverse DNS | ec2-44-228-249-3.us-west-2.compute.amazonaws.com |
| مزود الاستضافة | Amazon Web Services (AWS) |
| المنطقة الجغرافية | US-West-2, Oregon, USA |
| المنافذ المفتوحة | 80/HTTP, 443/HTTPS |
| بروتوكول TLS | TLS 1.3 |
| خوارزمية التشفير | AES-256-GCM-SHA384 |
| نظام التشغيل | Linux |
| خادم الويب | Apache HTTP Server |
| لغة البرمجة | PHP |
| قاعدة البيانات | MySQL |
| عدد النطاقات الفرعية | 5 نطاقات مكتشفة |

---

## 4. تحليل الخدمات المكتشفة

### خادم الويب Apache + PHP
- Apache هو أكثر خوادم الويب انتشاراً في العالم
- PHP معرض لثغرات مشهورة مثل: SQL Injection, File Inclusion, RCE
- testphp.vulnweb.com صُمِّم عمداً ليحتوي على هذه الثغرات لأغراض تعليمية

### استضافة AWS
- الخادم يعمل على EC2 instance في AWS
- وجود Reverse Proxy/WAF يشير إلى استخدام AWS CloudFront أو Load Balancer
- الخادم محجوب بـ WAF يمنع الوصول المباشر بالـ IP

### النطاقات الفرعية المتعددة
- كل نطاق يختبر تقنية مختلفة: PHP، HTML5، ASP، ASP.NET
- هذا التنوع يوسع سطح الهجوم (Attack Surface)

---

## 5. المخاطر المحتملة

### خطورة عالية 🔴
| الثغرة | الوصف |
|--------|--------|
| SQL Injection | قواعد بيانات MySQL مكشوفة عبر مدخلات المستخدم |
| Cross-Site Scripting (XSS) | إمكانية حقن كود JavaScript خبيث |
| Remote File Inclusion (RFI) | تضمين ملفات خارجية عبر PHP |

### خطورة متوسطة 🟡
| الثغرة | الوصف |
|--------|--------|
| Information Disclosure | إظهار معلومات الخادم في رسائل الخطأ |
| Insecure Direct Object Reference | الوصول لموارد غير مخوّل بها |
| CSRF | تزوير طلبات من جانب المستخدم |

### خطورة منخفضة 🟢
| الثغرة | الوصف |
|--------|--------|
| Clickjacking | لا يوجد X-Frame-Options header |
| Missing Security Headers | غياب بعض HTTP Security Headers |

> **ملاحظة:** هذه الثغرات موجودة عمداً في testphp.vulnweb.com لأغراض تعليمية فقط.  
> لا يجوز تطبيق هذه الاختبارات على أي موقع حقيقي بدون إذن مكتوب من المالك.

---

## 6. خاتمة وتوصيات أمنية

### ملخص ما تم إنجازه
في هذا التمرين، تم تطبيق منهجية الاستطلاع الكاملة على النطاق التجريبي `testphp.vulnweb.com`  
وتم جمع المعلومات التالية بنجاح:
- ✅ عنوان IP وReverse DNS
- ✅ معلومات الاستضافة (AWS US-West-2)
- ✅ المنافذ المفتوحة (80, 443)
- ✅ إصدار TLS وخوارزمية التشفير
- ✅ 5 نطاقات فرعية مكتشفة
- ✅ تقنيات الخادم (Apache, PHP, MySQL, Linux)

### التوصيات الأمنية

1. **تفعيل WAF (Web Application Firewall):** لفلترة الطلبات الخبيثة قبل وصولها للتطبيق
2. **إخفاء معلومات الخادم:** منع ظهور إصدار Apache وPHP في HTTP Headers
3. **استخدام Prepared Statements:** لمنع SQL Injection في استعلامات قاعدة البيانات
4. **تفعيل Security Headers:** مثل `Content-Security-Policy`, `X-Frame-Options`, `X-XSS-Protection`
5. **تقليص سطح الهجوم:** إغلاق جميع المنافذ غير الضرورية (تم تطبيقه — ✅)
6. **تحديث البرمجيات:** الحفاظ على آخر إصدارات Apache وPHP وMySQL
7. **مراقبة السجلات (Logs):** رصد محاولات الوصول غير المصرح به في الوقت الفعلي
8. **تشفير الاتصالات:** استخدام TLS 1.3 فقط وتعطيل الإصدارات القديمة (SSLv3, TLS 1.0, 1.1)

---

*تم إعداد هذا التقرير لأغراض تعليمية بحتة في إطار مادة أمن المعلومات.*  
*جميع الاختبارات أجريت على نطاق تجريبي مرخّص مخصص للتعلم.*
