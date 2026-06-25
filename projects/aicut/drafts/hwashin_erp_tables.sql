-- ============================================================
-- (주)화신기계상사 ERP - 영업관리(대리점) 데이터베이스
-- 기반 문서: 기능정의서 / 메뉴정의서 / 프로세스정의서 V1.0
-- DB: MySQL 8.0 / MariaDB 10.5+
-- ============================================================

-- ============================================================
-- 1. 기준정보 (Master Data)
-- ============================================================

-- 1.1 부서 (본사/지사)
CREATE TABLE TB_DEPT (
    dept_code       VARCHAR(10)     NOT NULL COMMENT '부서코드',
    dept_name       VARCHAR(100)    NOT NULL COMMENT '부서명',
    parent_code     VARCHAR(10)     NULL     COMMENT '상위부서코드',
    is_branch       CHAR(1)         NOT NULL DEFAULT 'N' COMMENT '지사여부 (Y/N)',
    region          VARCHAR(50)     NULL     COMMENT '지역',
    tel             VARCHAR(20)     NULL     COMMENT '전화번호',
    fax             VARCHAR(20)     NULL     COMMENT '팩스번호',
    use_yn          CHAR(1)         NOT NULL DEFAULT 'Y' COMMENT '사용여부',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (dept_code),
    FOREIGN KEY (parent_code) REFERENCES TB_DEPT(dept_code) ON DELETE SET NULL
) COMMENT='부서(본사/지사)';

-- 1.2 거래처 (고객/공급사 통합)
CREATE TABLE TB_CUSTOMER (
    cust_code       VARCHAR(20)     NOT NULL COMMENT '거래처코드',
    cust_name       VARCHAR(200)    NOT NULL COMMENT '거래처명',
    cust_type       VARCHAR(10)     NOT NULL DEFAULT 'CUSTOMER' COMMENT '유형 (CUSTOMER/VENDOR/BOTH)',
    biz_no          VARCHAR(20)     NULL     COMMENT '사업자번호',
    ceo_name        VARCHAR(50)     NULL     COMMENT '대표자명',
    tel             VARCHAR(20)     NULL     COMMENT '전화번호',
    fax             VARCHAR(20)     NULL     COMMENT '팩스번호',
    email           VARCHAR(100)    NULL     COMMENT '이메일',
    address         VARCHAR(300)    NULL     COMMENT '주소',
    sale_type       VARCHAR(20)     NULL     COMMENT '판매형태 (도매/소매/수출)',
    credit_limit    DECIMAL(15,0)   NULL     COMMENT '신용한도',
    mgr_code        VARCHAR(10)     NULL     COMMENT '담당자코드',
    use_yn          CHAR(1)         NOT NULL DEFAULT 'Y' COMMENT '사용여부',
    remark          VARCHAR(500)    NULL     COMMENT '비고',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (cust_code),
    INDEX idx_cust_type (cust_type),
    INDEX idx_mgr_code (mgr_code)
) COMMENT='거래처 (고객/공급사)';

-- 1.3 품목
CREATE TABLE TB_ITEM (
    item_code       VARCHAR(20)     NOT NULL COMMENT '품목코드',
    item_name       VARCHAR(200)    NOT NULL COMMENT '품목명',
    spec            VARCHAR(200)    NULL     COMMENT '규격',
    category        VARCHAR(20)     NULL     COMMENT '품목분류',
    unit            VARCHAR(10)     NOT NULL DEFAULT 'EA' COMMENT '단위',
    purchase_price  DECIMAL(15,0)   NULL     COMMENT '매입단가',
    sale_price      DECIMAL(15,0)   NULL     COMMENT '판매단가',
    retail_price    DECIMAL(15,0)   NULL     COMMENT '소매가',
    wholesale_price DECIMAL(15,0)   NULL     COMMENT '도매가',
    vat_rate        DECIMAL(3,1)    NOT NULL DEFAULT 10.0 COMMENT '부가세율(%)',
    sn_management   CHAR(1)         NOT NULL DEFAULT 'N' COMMENT 'S/N 관리여부',
    stock_qty       DECIMAL(15,2)   NULL     DEFAULT 0 COMMENT '현재고',
    safety_stock    DECIMAL(15,2)   NULL     DEFAULT 0 COMMENT '안전재고',
    use_yn          CHAR(1)         NOT NULL DEFAULT 'Y',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (item_code),
    INDEX idx_category (category)
) COMMENT='품목 마스터';

-- 1.4 담당자
CREATE TABLE TB_MANAGER (
    mgr_code        VARCHAR(10)     NOT NULL COMMENT '담당자코드',
    mgr_name        VARCHAR(50)     NOT NULL COMMENT '담당자명',
    dept_code       VARCHAR(10)     NOT NULL COMMENT '부서코드',
    position        VARCHAR(50)     NULL     COMMENT '직급 (담당/선임/책임/수석/상무/부사장/사장)',
    tel             VARCHAR(20)     NULL     COMMENT '전화번호',
    email           VARCHAR(100)    NULL     COMMENT '이메일',
    role_type       VARCHAR(20)     NULL     COMMENT '업무역할 (영업/회계/구매/물류/AS)',
    use_yn          CHAR(1)         NOT NULL DEFAULT 'Y',
    PRIMARY KEY (mgr_code),
    FOREIGN KEY (dept_code) REFERENCES TB_DEPT(dept_code)
) COMMENT='담당자';

-- 1.5 공통코드
CREATE TABLE TB_CODE_GROUP (
    group_code      VARCHAR(20)     NOT NULL COMMENT '그룹코드',
    group_name      VARCHAR(100)    NOT NULL COMMENT '그룹명',
    description     VARCHAR(300)    NULL     COMMENT '설명',
    use_yn          CHAR(1)         NOT NULL DEFAULT 'Y',
    PRIMARY KEY (group_code)
) COMMENT='코드그룹';

CREATE TABLE TB_CODE (
    group_code      VARCHAR(20)     NOT NULL COMMENT '그룹코드',
    code            VARCHAR(20)     NOT NULL COMMENT '코드',
    code_name       VARCHAR(100)    NOT NULL COMMENT '코드명',
    sort_order      INT             NOT NULL DEFAULT 0 COMMENT '정렬순서',
    attr1           VARCHAR(100)    NULL     COMMENT '속성1',
    attr2           VARCHAR(100)    NULL     COMMENT '속성2',
    use_yn          CHAR(1)         NOT NULL DEFAULT 'Y',
    PRIMARY KEY (group_code, code),
    FOREIGN KEY (group_code) REFERENCES TB_CODE_GROUP(group_code)
) COMMENT='공통코드';
-- 주요 코드그룹: 결제구분, 형태구분, 판매형태, 수리구분(유상/무상), 창고, 마감여부 등

-- ============================================================
-- 2. 견적/OFFER 관리 (Module A)
-- ============================================================

-- 2.1 견적
CREATE TABLE TB_QUOTE (
    quote_no        VARCHAR(20)     NOT NULL COMMENT '견적번호 (자동채번)',
    quote_date      DATE            NOT NULL COMMENT '견적일자',
    cust_code       VARCHAR(20)     NOT NULL COMMENT '거래처코드',
    mgr_code        VARCHAR(10)     NOT NULL COMMENT '담당자코드',
    dept_code       VARCHAR(10)     NULL     COMMENT '부서코드',
    receiver        VARCHAR(100)    NULL     COMMENT '수신처',
    valid_until     DATE            NULL     COMMENT '유효기간',
    discount_amt    DECIMAL(15,0)   NULL     DEFAULT 0 COMMENT '할인금액',
    total_supply    DECIMAL(15,0)   NOT NULL DEFAULT 0 COMMENT '공급가합계',
    total_vat       DECIMAL(15,0)   NOT NULL DEFAULT 0 COMMENT '부가세합계',
    total_amt       DECIMAL(15,0)   NOT NULL DEFAULT 0 COMMENT '총액',
    status          VARCHAR(20)     NOT NULL DEFAULT 'QUOTE' COMMENT '상태 (QUOTE/CONFIRMED/CANCELED)',
    remark          VARCHAR(500)    NULL     COMMENT '비고',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (quote_no),
    FOREIGN KEY (cust_code) REFERENCES TB_CUSTOMER(cust_code),
    FOREIGN KEY (mgr_code) REFERENCES TB_MANAGER(mgr_code),
    FOREIGN KEY (dept_code) REFERENCES TB_DEPT(dept_code),
    INDEX idx_quote_date (quote_date),
    INDEX idx_status (status)
) COMMENT='견적서';

-- 2.2 견적 품목
CREATE TABLE TB_QUOTE_ITEM (
    quote_no        VARCHAR(20)     NOT NULL COMMENT '견적번호',
    seq             INT             NOT NULL COMMENT '순번',
    item_code       VARCHAR(20)     NOT NULL COMMENT '품목코드',
    qty             DECIMAL(15,2)   NOT NULL DEFAULT 1 COMMENT '수량',
    apply_price     VARCHAR(50)     NULL     COMMENT '적용가격구분 (도매가/소매가)',
    apply_rate      DECIMAL(5,2)    NULL     COMMENT '적용율(%)',
    unit_price      DECIMAL(15,0)   NOT NULL COMMENT '단가',
    supply_amt      DECIMAL(15,0)   NOT NULL DEFAULT 0 COMMENT '공급가',
    vat_amt         DECIMAL(15,0)   NOT NULL DEFAULT 0 COMMENT '부가세',
    delivery_date   DATE            NULL     COMMENT '납기일자',
    remark          VARCHAR(200)    NULL     COMMENT '비고',
    PRIMARY KEY (quote_no, seq),
    FOREIGN KEY (quote_no) REFERENCES TB_QUOTE(quote_no) ON DELETE CASCADE,
    FOREIGN KEY (item_code) REFERENCES TB_ITEM(item_code)
) COMMENT='견적 품목';

-- 2.3 OFFER (수입/수출)
CREATE TABLE TB_OFFER (
    offer_no        VARCHAR(20)     NOT NULL COMMENT 'OFFER번호',
    offer_date      DATE            NOT NULL COMMENT 'OFFER일자',
    cust_code       VARCHAR(20)     NOT NULL COMMENT '거래처코드',
    mgr_code        VARCHAR(10)     NOT NULL COMMENT '담당자코드',
    offer_type      VARCHAR(10)     NOT NULL COMMENT '유형 (수입/수출)',
    currency        VARCHAR(10)     NULL     DEFAULT 'USD' COMMENT '통화',
    exchange_rate   DECIMAL(10,2)   NULL     COMMENT '환율',
    total_supply    DECIMAL(15,0)   NOT NULL DEFAULT 0 COMMENT '공급가합계',
    total_vat       DECIMAL(15,0)   NOT NULL DEFAULT 0 COMMENT '부가세',
    total_amt       DECIMAL(15,0)   NOT NULL DEFAULT 0 COMMENT '총액',
    status          VARCHAR(20)     NOT NULL DEFAULT 'OFFER' COMMENT '상태',
    remark          VARCHAR(500)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (offer_no),
    FOREIGN KEY (cust_code) REFERENCES TB_CUSTOMER(cust_code),
    FOREIGN KEY (mgr_code) REFERENCES TB_MANAGER(mgr_code)
) COMMENT='OFFER (수입/수출)';

-- 2.4 OFFER 품목
CREATE TABLE TB_OFFER_ITEM (
    offer_no        VARCHAR(20)     NOT NULL,
    seq             INT             NOT NULL,
    item_code       VARCHAR(20)     NOT NULL,
    qty             DECIMAL(15,2)   NOT NULL DEFAULT 1,
    unit_price      DECIMAL(15,0)   NOT NULL,
    supply_amt      DECIMAL(15,0)   NOT NULL DEFAULT 0,
    vat_amt         DECIMAL(15,0)   NOT NULL DEFAULT 0,
    delivery_date   DATE            NULL,
    remark          VARCHAR(200)    NULL,
    PRIMARY KEY (offer_no, seq),
    FOREIGN KEY (offer_no) REFERENCES TB_OFFER(offer_no) ON DELETE CASCADE,
    FOREIGN KEY (item_code) REFERENCES TB_ITEM(item_code)
) COMMENT='OFFER 품목';

-- 2.5 수입발주
CREATE TABLE TB_IMPORT_ORDER (
    order_no        VARCHAR(20)     NOT NULL COMMENT '발주번호',
    order_date      DATE            NOT NULL COMMENT '발주일자',
    offer_no        VARCHAR(20)     NULL     COMMENT '관련OFFER',
    cust_code       VARCHAR(20)     NOT NULL COMMENT '공급사',
    mgr_code        VARCHAR(10)     NOT NULL,
    total_amt       DECIMAL(15,0)   NOT NULL DEFAULT 0,
    status          VARCHAR(20)     NOT NULL DEFAULT 'ORDERED' COMMENT '상태 (ORDERED/SHIPPED/ARRIVED/CLOSED)',
    remark          VARCHAR(500)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (order_no),
    FOREIGN KEY (offer_no) REFERENCES TB_OFFER(offer_no),
    FOREIGN KEY (cust_code) REFERENCES TB_CUSTOMER(cust_code)
) COMMENT='수입발주';

-- 2.6 수입발주 품목
CREATE TABLE TB_IMPORT_ORDER_ITEM (
    order_no        VARCHAR(20)     NOT NULL,
    seq             INT             NOT NULL,
    item_code       VARCHAR(20)     NOT NULL,
    qty             DECIMAL(15,2)   NOT NULL,
    unit_price      DECIMAL(15,0)   NOT NULL,
    supply_amt      DECIMAL(15,0)   NOT NULL DEFAULT 0,
    arrival_qty     DECIMAL(15,2)   NULL     DEFAULT 0 COMMENT '입고수량',
    arrival_date    DATE            NULL     COMMENT '입고일자',
    remark          VARCHAR(200)    NULL,
    PRIMARY KEY (order_no, seq),
    FOREIGN KEY (order_no) REFERENCES TB_IMPORT_ORDER(order_no) ON DELETE CASCADE,
    FOREIGN KEY (item_code) REFERENCES TB_ITEM(item_code)
) COMMENT='수입발주 품목';

-- ============================================================
-- 3. 판매관리 (Module B)
-- ============================================================

-- 3.1 판매(출고)
CREATE TABLE TB_SALES (
    sale_no         VARCHAR(20)     NOT NULL COMMENT '판매번호',
    sale_date       DATE            NOT NULL COMMENT '판매일자',
    sale_type       VARCHAR(20)     NOT NULL COMMENT '판매유형 (출고전표/기타출고/수출/대리점)',
    cust_code       VARCHAR(20)     NOT NULL,
    mgr_code        VARCHAR(10)     NOT NULL,
    dept_code       VARCHAR(10)     NULL,
    quote_no        VARCHAR(20)     NULL     COMMENT '관련견적서',
    total_supply    DECIMAL(15,0)   NOT NULL DEFAULT 0,
    total_vat       DECIMAL(15,0)   NOT NULL DEFAULT 0,
    total_amt       DECIMAL(15,0)   NOT NULL DEFAULT 0,
    remark          VARCHAR(500)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (sale_no),
    FOREIGN KEY (cust_code) REFERENCES TB_CUSTOMER(cust_code),
    FOREIGN KEY (mgr_code) REFERENCES TB_MANAGER(mgr_code),
    FOREIGN KEY (quote_no) REFERENCES TB_QUOTE(quote_no),
    INDEX idx_sale_date (sale_date),
    INDEX idx_sale_type (sale_type)
) COMMENT='판매(출고전표)';

-- 3.2 판매 품목
CREATE TABLE TB_SALES_ITEM (
    sale_no         VARCHAR(20)     NOT NULL,
    seq             INT             NOT NULL,
    item_code       VARCHAR(20)     NOT NULL,
    qty             DECIMAL(15,2)   NOT NULL,
    unit_price      DECIMAL(15,0)   NOT NULL COMMENT '판매단가',
    supply_amt      DECIMAL(15,0)   NOT NULL DEFAULT 0,
    vat_amt         DECIMAL(15,0)   NOT NULL DEFAULT 0,
    discount_amt    DECIMAL(15,0)   NULL     DEFAULT 0,
    remark          VARCHAR(200)    NULL,
    PRIMARY KEY (sale_no, seq),
    FOREIGN KEY (sale_no) REFERENCES TB_SALES(sale_no) ON DELETE CASCADE,
    FOREIGN KEY (item_code) REFERENCES TB_ITEM(item_code)
) COMMENT='판매 품목';

-- 3.3 세금계산서
CREATE TABLE TB_TAX_INVOICE (
    tax_inv_no      VARCHAR(30)     NOT NULL COMMENT '세금계산서번호',
    issue_date      DATE            NOT NULL COMMENT '발행일자',
    sale_no         VARCHAR(20)     NULL     COMMENT '관련판매',
    cust_code       VARCHAR(20)     NOT NULL,
    supply_amt      DECIMAL(15,0)   NOT NULL DEFAULT 0,
    vat_amt         DECIMAL(15,0)   NOT NULL DEFAULT 0,
    total_amt       DECIMAL(15,0)   NOT NULL DEFAULT 0,
    status          VARCHAR(20)     NOT NULL DEFAULT 'ISSUED' COMMENT '상태 (ISSUED/CANCELED)',
    remark          VARCHAR(500)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tax_inv_no),
    FOREIGN KEY (sale_no) REFERENCES TB_SALES(sale_no),
    FOREIGN KEY (cust_code) REFERENCES TB_CUSTOMER(cust_code),
    INDEX idx_issue_date (issue_date)
) COMMENT='세금계산서';

-- 3.4 거래명세서
CREATE TABLE TB_TRANSACTION_STMT (
    stmt_no         VARCHAR(20)     NOT NULL,
    stmt_date       DATE            NOT NULL,
    sale_no         VARCHAR(20)     NOT NULL,
    cust_code       VARCHAR(20)     NOT NULL,
    total_amt       DECIMAL(15,0)   NOT NULL DEFAULT 0,
    issued_yn       CHAR(1)         NOT NULL DEFAULT 'N' COMMENT '발행여부',
    issued_at       DATETIME        NULL,
    PRIMARY KEY (stmt_no),
    FOREIGN KEY (sale_no) REFERENCES TB_SALES(sale_no),
    FOREIGN KEY (cust_code) REFERENCES TB_CUSTOMER(cust_code)
) COMMENT='거래명세서';

-- 3.5 반품 (매출)
CREATE TABLE TB_SALES_RETURN (
    return_no       VARCHAR(20)     NOT NULL,
    return_date     DATE            NOT NULL,
    sale_no         VARCHAR(20)     NOT NULL COMMENT '원판매',
    cust_code       VARCHAR(20)     NOT NULL,
    mgr_code        VARCHAR(10)     NOT NULL,
    total_amt       DECIMAL(15,0)   NOT NULL DEFAULT 0,
    reason          VARCHAR(300)    NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'RETURNED',
    PRIMARY KEY (return_no),
    FOREIGN KEY (sale_no) REFERENCES TB_SALES(sale_no),
    FOREIGN KEY (cust_code) REFERENCES TB_CUSTOMER(cust_code)
) COMMENT='매출반품';

-- 3.6 단가적용율
CREATE TABLE TB_PRICE_RATE (
    rate_id         INT             AUTO_INCREMENT,
    item_code       VARCHAR(20)     NOT NULL,
    cust_code       VARCHAR(20)     NULL     COMMENT '거래처별(선택)',
    apply_rate      DECIMAL(5,2)    NOT NULL COMMENT '적용율(%)',
    effective_from  DATE            NOT NULL,
    effective_to    DATE            NULL,
    PRIMARY KEY (rate_id),
    FOREIGN KEY (item_code) REFERENCES TB_ITEM(item_code),
    FOREIGN KEY (cust_code) REFERENCES TB_CUSTOMER(cust_code)
) COMMENT='단가적용율';

-- 3.7 대리점주문 (본사 수신)
CREATE TABLE TB_DEALER_ORDER (
    order_no        VARCHAR(20)     NOT NULL,
    order_date      DATE            NOT NULL,
    dealer_code     VARCHAR(20)     NOT NULL COMMENT '대리점코드',
    item_code       VARCHAR(20)     NOT NULL,
    qty             DECIMAL(15,2)   NOT NULL,
    price           DECIMAL(15,0)   NULL,
    sale_no         VARCHAR(20)     NULL     COMMENT '연결판매번호(출고후)',
    status          VARCHAR(20)     NOT NULL DEFAULT 'ORDERED' COMMENT '상태 (ORDERED/SHIPPED/COMPLETED)',
    remark          VARCHAR(200)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (order_no),
    FOREIGN KEY (dealer_code) REFERENCES TB_CUSTOMER(cust_code),
    FOREIGN KEY (item_code) REFERENCES TB_ITEM(item_code),
    FOREIGN KEY (sale_no) REFERENCES TB_SALES(sale_no),
    INDEX idx_status (status)
) COMMENT='대리점주문';

-- ============================================================
-- 4. 수금관리 (Module C)
-- ============================================================

-- 4.1 수금
CREATE TABLE TB_COLLECTION (
    collect_no      VARCHAR(20)     NOT NULL,
    collect_date    DATE            NOT NULL,
    cust_code       VARCHAR(20)     NOT NULL,
    sale_no         VARCHAR(20)     NULL     COMMENT '대상판매',
    collect_amt     DECIMAL(15,0)   NOT NULL DEFAULT 0,
    collect_type    VARCHAR(20)     NOT NULL COMMENT '수금유형 (현금/어음/카드/계좌이체)',
    remark          VARCHAR(200)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collect_no),
    FOREIGN KEY (cust_code) REFERENCES TB_CUSTOMER(cust_code),
    FOREIGN KEY (sale_no) REFERENCES TB_SALES(sale_no),
    INDEX idx_collect_date (collect_date)
) COMMENT='수금';

-- 4.2 선수금
CREATE TABLE TB_ADVANCE_RECEIPT (
    adv_no          VARCHAR(20)     NOT NULL,
    adv_date        DATE            NOT NULL,
    cust_code       VARCHAR(20)     NOT NULL,
    adv_amt         DECIMAL(15,0)   NOT NULL COMMENT '선수금액',
    remain_amt      DECIMAL(15,0)   NOT NULL COMMENT '잔액',
    remark          VARCHAR(200)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (adv_no),
    FOREIGN KEY (cust_code) REFERENCES TB_CUSTOMER(cust_code)
) COMMENT='선수금';

-- 4.3 선수금 사용내역
CREATE TABLE TB_ADVANCE_USAGE (
    adv_no          VARCHAR(20)     NOT NULL,
    seq             INT             NOT NULL,
    sale_no         VARCHAR(20)     NOT NULL,
    use_amt         DECIMAL(15,0)   NOT NULL,
    PRIMARY KEY (adv_no, seq),
    FOREIGN KEY (adv_no) REFERENCES TB_ADVANCE_RECEIPT(adv_no) ON DELETE CASCADE,
    FOREIGN KEY (sale_no) REFERENCES TB_SALES(sale_no)
) COMMENT='선수금 사용내역';

-- ============================================================
-- 5. 매입관리 (Module D)
-- ============================================================

-- 5.1 매입
CREATE TABLE TB_PURCHASE (
    purchase_no     VARCHAR(20)     NOT NULL,
    purchase_date   DATE            NOT NULL,
    vendor_code     VARCHAR(20)     NOT NULL COMMENT '공급사',
    mgr_code        VARCHAR(10)     NULL,
    purchase_type   VARCHAR(20)     NOT NULL COMMENT '매입유형 (매입전표/매입계산서/수입입고/생산입고)',
    total_supply    DECIMAL(15,0)   NOT NULL DEFAULT 0,
    total_vat       DECIMAL(15,0)   NOT NULL DEFAULT 0,
    total_amt       DECIMAL(15,0)   NOT NULL DEFAULT 0,
    status          VARCHAR(20)     NOT NULL DEFAULT 'PURCHASED',
    remark          VARCHAR(500)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (purchase_no),
    FOREIGN KEY (vendor_code) REFERENCES TB_CUSTOMER(cust_code),
    FOREIGN KEY (mgr_code) REFERENCES TB_MANAGER(mgr_code),
    INDEX idx_purchase_date (purchase_date)
) COMMENT='매입';

-- 5.2 매입 품목
CREATE TABLE TB_PURCHASE_ITEM (
    purchase_no     VARCHAR(20)     NOT NULL,
    seq             INT             NOT NULL,
    item_code       VARCHAR(20)     NOT NULL,
    qty             DECIMAL(15,2)   NOT NULL,
    unit_price      DECIMAL(15,0)   NOT NULL,
    supply_amt      DECIMAL(15,0)   NOT NULL DEFAULT 0,
    vat_amt         DECIMAL(15,0)   NOT NULL DEFAULT 0,
    remark          VARCHAR(200)    NULL,
    PRIMARY KEY (purchase_no, seq),
    FOREIGN KEY (purchase_no) REFERENCES TB_PURCHASE(purchase_no) ON DELETE CASCADE,
    FOREIGN KEY (item_code) REFERENCES TB_ITEM(item_code)
) COMMENT='매입 품목';

-- 5.3 매입반품
CREATE TABLE TB_PURCHASE_RETURN (
    return_no       VARCHAR(20)     NOT NULL,
    return_date     DATE            NOT NULL,
    purchase_no     VARCHAR(20)     NOT NULL,
    item_code       VARCHAR(20)     NOT NULL,
    qty             DECIMAL(15,2)   NOT NULL,
    reason          VARCHAR(300)    NULL,
    PRIMARY KEY (return_no),
    FOREIGN KEY (purchase_no) REFERENCES TB_PURCHASE(purchase_no)
) COMMENT='매입반품';

-- ============================================================
-- 6. 지불관리 (Module E)
-- ============================================================

-- 6.1 지불
CREATE TABLE TB_PAYMENT (
    pay_no          VARCHAR(20)     NOT NULL,
    pay_date        DATE            NOT NULL,
    vendor_code     VARCHAR(20)     NOT NULL COMMENT '공급사',
    purchase_no     VARCHAR(20)     NULL,
    pay_amt         DECIMAL(15,0)   NOT NULL,
    pay_type        VARCHAR(20)     NOT NULL COMMENT '지불유형',
    remark          VARCHAR(200)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (pay_no),
    FOREIGN KEY (vendor_code) REFERENCES TB_CUSTOMER(cust_code),
    FOREIGN KEY (purchase_no) REFERENCES TB_PURCHASE(purchase_no),
    INDEX idx_pay_date (pay_date)
) COMMENT='지불';

-- ============================================================
-- 7. 수리/S/N관리 (Module F)
-- ============================================================

-- 7.1 수리접수
CREATE TABLE TB_REPAIR (
    repair_no       VARCHAR(20)     NOT NULL,
    receipt_date    DATE            NOT NULL COMMENT '접수일자',
    cust_code       VARCHAR(20)     NOT NULL COMMENT '고객',
    item_code       VARCHAR(20)     NOT NULL,
    serial_no       VARCHAR(50)     NULL     COMMENT 'S/N',
    repair_type     VARCHAR(10)     NOT NULL COMMENT '수리구분 (무상/유상)',
    symptom         VARCHAR(500)    NULL     COMMENT '증상',
    action_detail   VARCHAR(500)    NULL     COMMENT '조치내역',
    charge_amt      DECIMAL(15,0)   NULL     DEFAULT 0 COMMENT '유상수리비',
    status          VARCHAR(20)     NOT NULL DEFAULT 'RECEIVED' COMMENT '상태 (RECEIVED/IN_PROGRESS/COMPLETED)',
    complete_date   DATE            NULL,
    mgr_code        VARCHAR(10)     NULL     COMMENT '담당자',
    remark          VARCHAR(500)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (repair_no),
    FOREIGN KEY (cust_code) REFERENCES TB_CUSTOMER(cust_code),
    FOREIGN KEY (item_code) REFERENCES TB_ITEM(item_code),
    FOREIGN KEY (mgr_code) REFERENCES TB_MANAGER(mgr_code),
    INDEX idx_receipt_date (receipt_date)
) COMMENT='수리접수';

-- 7.2 S/N (시리얼번호) 마스터
CREATE TABLE TB_SERIAL (
    serial_no       VARCHAR(50)     NOT NULL,
    item_code       VARCHAR(20)     NOT NULL,
    manufacture_date DATE           NULL,
    sale_no         VARCHAR(20)     NULL     COMMENT '판매연결',
    cust_code       VARCHAR(20)     NULL     COMMENT '최종고객',
    warranty_from   DATE            NULL     COMMENT '보증기간시작',
    warranty_to     DATE            NULL     COMMENT '보증기간종료',
    status          VARCHAR(20)     NOT NULL DEFAULT 'IN_STOCK' COMMENT '상태 (IN_STOCK/SOLD/REPAIR/SCRAP)',
    remark          VARCHAR(200)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (serial_no),
    FOREIGN KEY (item_code) REFERENCES TB_ITEM(item_code),
    FOREIGN KEY (sale_no) REFERENCES TB_SALES(sale_no),
    INDEX idx_serial_status (status)
) COMMENT='S/N(시리얼번호) 관리';

-- ============================================================
-- 8. 재고/수불 (Module G, H)
-- ============================================================

-- 8.1 재고
CREATE TABLE TB_STOCK (
    item_code       VARCHAR(20)     NOT NULL,
    dept_code       VARCHAR(10)     NOT NULL COMMENT '창고(부서)',
    qty             DECIMAL(15,2)   NOT NULL DEFAULT 0,
    safety_stock    DECIMAL(15,2)   NULL     DEFAULT 0 COMMENT '안전재고',
    last_updated    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (item_code, dept_code),
    FOREIGN KEY (item_code) REFERENCES TB_ITEM(item_code),
    FOREIGN KEY (dept_code) REFERENCES TB_DEPT(dept_code)
) COMMENT='재고';

-- 8.2 수불(재고이동) 이력
CREATE TABLE TB_STOCK_TRANS (
    trans_no        BIGINT          AUTO_INCREMENT,
    trans_date      DATE            NOT NULL,
    item_code       VARCHAR(20)     NOT NULL,
    dept_code       VARCHAR(10)     NOT NULL,
    trans_type      VARCHAR(10)     NOT NULL COMMENT '유형 (IN/OUT/MOVE_ADJUST)',
    qty             DECIMAL(15,2)   NOT NULL,
    before_qty      DECIMAL(15,2)   NULL,
    after_qty       DECIMAL(15,2)   NULL,
    ref_type        VARCHAR(20)     NULL COMMENT '참조유형 (SALE/PURCHASE/RETURN/MOVE/ADJUST)',
    ref_no          VARCHAR(20)     NULL COMMENT '참조번호',
    remark          VARCHAR(200)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (trans_no),
    FOREIGN KEY (item_code) REFERENCES TB_ITEM(item_code),
    FOREIGN KEY (dept_code) REFERENCES TB_DEPT(dept_code),
    INDEX idx_trans_date (trans_date),
    INDEX idx_trans_type (trans_type)
) COMMENT='수불(재고이동) 이력';

-- 8.3 본/지사 재고이동
CREATE TABLE TB_HQ_BRANCH_TRANS (
    trans_no        VARCHAR(20)     NOT NULL,
    trans_date      DATE            NOT NULL,
    item_code       VARCHAR(20)     NOT NULL,
    from_dept       VARCHAR(10)     NOT NULL COMMENT '출고창고',
    to_dept         VARCHAR(10)     NOT NULL COMMENT '입고창고',
    qty             DECIMAL(15,2)   NOT NULL,
    status          VARCHAR(20)     NOT NULL DEFAULT 'REQUESTED' COMMENT '상태 (REQUESTED/SHIPPED/CONFIRMED)',
    confirm_date    DATE            NULL,
    remark          VARCHAR(200)    NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (trans_no),
    FOREIGN KEY (item_code) REFERENCES TB_ITEM(item_code),
    FOREIGN KEY (from_dept) REFERENCES TB_DEPT(dept_code),
    FOREIGN KEY (to_dept) REFERENCES TB_DEPT(dept_code)
) COMMENT='본/지사 재고이동';

-- 8.4 기초재고
CREATE TABLE TB_INITIAL_STOCK (
    item_code       VARCHAR(20)     NOT NULL,
    dept_code       VARCHAR(10)     NOT NULL,
    fiscal_year     INT             NOT NULL COMMENT '회계년도',
    init_qty        DECIMAL(15,2)   NOT NULL DEFAULT 0,
    init_amt        DECIMAL(15,0)   NOT NULL DEFAULT 0,
    input_date      DATE            NULL,
    remark          VARCHAR(200)    NULL,
    PRIMARY KEY (item_code, dept_code, fiscal_year),
    FOREIGN KEY (item_code) REFERENCES TB_ITEM(item_code),
    FOREIGN KEY (dept_code) REFERENCES TB_DEPT(dept_code)
) COMMENT='기초재고잔액';

-- 8.5 재고실사
CREATE TABLE TB_STOCK_ADJUST (
    adjust_no       VARCHAR(20)     NOT NULL,
    adjust_date     DATE            NOT NULL,
    item_code       VARCHAR(20)     NOT NULL,
    dept_code       VARCHAR(10)     NOT NULL,
    book_qty        DECIMAL(15,2)   NOT NULL COMMENT '장부수량',
    actual_qty      DECIMAL(15,2)   NOT NULL COMMENT '실사수량',
    diff_qty        DECIMAL(15,2)   NOT NULL COMMENT '차이',
    reason          VARCHAR(300)    NULL,
    mgr_code        VARCHAR(10)     NULL,
    PRIMARY KEY (adjust_no),
    FOREIGN KEY (item_code) REFERENCES TB_ITEM(item_code),
    FOREIGN KEY (dept_code) REFERENCES TB_DEPT(dept_code)
) COMMENT='재고실사/조정';

-- ============================================================
-- 9. 시스템/보조 (Module I)
-- ============================================================

-- 9.1 사용자
CREATE TABLE TB_USER (
    user_id         VARCHAR(30)     NOT NULL,
    user_name       VARCHAR(50)     NOT NULL,
    mgr_code        VARCHAR(10)     NULL,
    dept_code       VARCHAR(10)     NOT NULL,
    auth_level      VARCHAR(20)     NOT NULL COMMENT '권한등급 (MASTER/ADMIN/USER/DEALER)',
    role_type       VARCHAR(50)     NULL     COMMENT '업무역할 (영업/회계/구매/물류/AS)',
    password_hash   VARCHAR(200)    NOT NULL,
    use_yn          CHAR(1)         NOT NULL DEFAULT 'Y',
    last_login      DATETIME        NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id),
    FOREIGN KEY (dept_code) REFERENCES TB_DEPT(dept_code),
    FOREIGN KEY (mgr_code) REFERENCES TB_MANAGER(mgr_code)
) COMMENT='사용자';

-- 9.2 프로그램(메뉴) 권한
CREATE TABLE TB_PROGRAM (
    pgm_id          VARCHAR(20)     NOT NULL COMMENT '프로그램ID (M-A-01 ~ M-A-16 등)',
    pgm_name        VARCHAR(100)    NOT NULL COMMENT '프로그램명',
    module_code     VARCHAR(10)     NOT NULL COMMENT '모듈코드 (A~I, DL)',
    depth1          VARCHAR(100)    NULL,
    depth2          VARCHAR(100)    NULL,
    depth3          VARCHAR(100)    NULL COMMENT '메뉴명',
    screen_type     VARCHAR(20)     NOT NULL COMMENT '화면유형 (입력/출력/조회/처리)',
    auth_required   VARCHAR(50)     NULL     COMMENT '필요권한',
    func_id         VARCHAR(20)     NULL     COMMENT '연관기능ID',
    process_id      VARCHAR(20)     NULL     COMMENT '연관프로세스ID',
    sort_order      INT             NOT NULL DEFAULT 0,
    use_yn          CHAR(1)         NOT NULL DEFAULT 'Y',
    PRIMARY KEY (pgm_id),
    INDEX idx_module (module_code),
    INDEX idx_func (func_id)
) COMMENT='프로그램(메뉴)';

-- 9.3 메뉴권한 (역할별 접근권한)
CREATE TABLE TB_ROLE_MENU (
    role_type       VARCHAR(20)     NOT NULL COMMENT '업무역할',
    pgm_id          VARCHAR(20)     NOT NULL COMMENT '프로그램ID',
    auth_level      VARCHAR(20)     NOT NULL COMMENT '권한등급',
    can_read        CHAR(1)         NOT NULL DEFAULT 'Y',
    can_write       CHAR(1)         NOT NULL DEFAULT 'N',
    PRIMARY KEY (role_type, pgm_id, auth_level),
    FOREIGN KEY (pgm_id) REFERENCES TB_PROGRAM(pgm_id)
) COMMENT='역할별 메뉴권한';

-- 9.4 마감관리
CREATE TABLE TB_CLOSING (
    close_ym        VARCHAR(7)      NOT NULL COMMENT '마감년월 (YYYY-MM)',
    dept_code       VARCHAR(10)     NOT NULL,
    close_type      VARCHAR(10)     NOT NULL COMMENT '마감구분 (DAILY/MONTHLY/YEARLY)',
    close_date      DATE            NULL     COMMENT '마감일자',
    status          VARCHAR(20)     NOT NULL DEFAULT 'OPEN' COMMENT '상태 (OPEN/CLOSED)',
    closed_by       VARCHAR(30)     NULL,
    closed_at       DATETIME        NULL,
    remark          VARCHAR(200)    NULL,
    PRIMARY KEY (close_ym, dept_code, close_type),
    FOREIGN KEY (dept_code) REFERENCES TB_DEPT(dept_code)
) COMMENT='마감관리';

-- 9.5 환경설정
CREATE TABLE TB_CONFIG (
    config_key      VARCHAR(50)     NOT NULL,
    config_value    VARCHAR(500)    NOT NULL,
    description     VARCHAR(200)    NULL,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (config_key)
) COMMENT='환경설정';

-- 9.6 결재라인
CREATE TABLE TB_APPROVAL_LINE (
    line_id         INT             AUTO_INCREMENT,
    step            INT             NOT NULL COMMENT '결재단계 (1~7)',
    position        VARCHAR(50)     NOT NULL COMMENT '직급 (담당/선임/책임/수석/상무/부사장/사장)',
    approval_type   VARCHAR(20)     NOT NULL COMMENT '결재구분',
    PRIMARY KEY (line_id),
    UNIQUE KEY uk_step (step)
) COMMENT='결재라인 (7단계)';

-- ============================================================
-- 10. 인덱스 및 성능 최적화
-- ============================================================

CREATE INDEX idx_sales_cust ON TB_SALES(cust_code);
CREATE INDEX idx_sales_mgr ON TB_SALES(mgr_code);
CREATE INDEX idx_purchase_vendor ON TB_PURCHASE(vendor_code);
CREATE INDEX idx_collection_cust ON TB_COLLECTION(cust_code);
CREATE INDEX idx_payment_vendor ON TB_PAYMENT(vendor_code);
CREATE INDEX idx_repair_cust ON TB_REPAIR(cust_code);
CREATE INDEX idx_serial_item ON TB_SERIAL(item_code);
CREATE INDEX idx_stock_trans_ref ON TB_STOCK_TRANS(ref_type, ref_no);
CREATE INDEX idx_dealer_order_status ON TB_DEALER_ORDER(status, order_date);
CREATE INDEX idx_quote_cust_date ON TB_QUOTE(cust_code, quote_date);
CREATE INDEX idx_tax_invoice_cust ON TB_TAX_INVOICE(cust_code, issue_date);

-- ============================================================
-- 11. ERD 관계 요약
-- ============================================================
/*
TB_DEPT ──< TB_MANAGER ──< TB_SALES
TB_DEPT ──< TB_STOCK >── TB_ITEM
TB_DEPT ──< TB_HQ_BRANCH_TRANS (from/to)
TB_DEPT ──< TB_CLOSING

TB_CUSTOMER ──< TB_QUOTE ──< TB_QUOTE_ITEM >── TB_ITEM
TB_CUSTOMER ──< TB_SALES ──< TB_SALES_ITEM >── TB_ITEM
TB_CUSTOMER ──< TB_COLLECTION
TB_CUSTOMER ──< TB_ADVANCE_RECEIPT
TB_CUSTOMER ──< TB_TAX_INVOICE
TB_CUSTOMER ──< TB_REPAIR
TB_CUSTOMER ──< TB_DEALER_ORDER (as dealer)

TB_ITEM ──< TB_SERIAL
TB_ITEM ──< TB_PRICE_RATE
TB_ITEM ──< TB_STOCK
TB_ITEM ──< TB_STOCK_TRANS
TB_ITEM ──< TB_INITIAL_STOCK
TB_ITEM ──< TB_STOCK_ADJUST

TB_SALES ──< TB_SALES_RETURN
TB_SALES ──< TB_TRANSACTION_STMT
TB_PURCHASE ──< TB_PURCHASE_RETURN
TB_PURCHASE ──< TB_PAYMENT

TB_QUOTE ──< TB_SALES (nullable)

TB_OFFER ──< TB_IMPORT_ORDER
TB_IMPORT_ORDER ──< TB_IMPORT_ORDER_ITEM >── TB_ITEM
*/
