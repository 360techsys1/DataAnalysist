// Hilal Foods Database Schema Configuration
// This describes the key tables for text-to-SQL generation

export const schemaDescription = `
DATABASE SCHEMA FOR HILAL FOODS (SQL Server):

=== DISTRIBUTOR DATA ===
1. DIMDISTRIBUTION_MASTER (Distributor Master Data)
   - DISTKEY (PK): Distributor key (INT)
   - COMPANY_ID: Company ID
   - CODE: Distributor code (VARCHAR)
   - NAME: Distributor name (VARCHAR) - e.g., "KARACHI WAREHOUSE", "KARACHI IMT"
   - BUSINESS_MODEL: Business model (VARCHAR) - e.g., "SUNDRY OTHERS"
   - TYPE: Type of distribution (VARCHAR) - e.g., "General Trade", "Export", "Key Account"
   - CLASSIFICATION: Classification (VARCHAR) - e.g., "Urban", "Rural", "Handler"
   - STATUS: Active/Inactive status
   - COUNTRY: Operating country (VARCHAR) - e.g., "PAKISTAN", "UAE"

2. DIMDISTRIBUTION_LOCATION (Distributor Location Data)
   - DIST_LOCKEY (PK): Key for distributor location (INT)
   - DISTKEY (FK): Links to DIMDISTRIBUTION_MASTER.DISTKEY
   - DISTRIBUTION_LOCATIONID: Location ID
   - ZONE: Zone (VARCHAR) - e.g., "CENTRAL", "NORTH"
   - REGION: Region (VARCHAR) - e.g., "Islamabad", "Karachi", "United Kingdom-Export"
   - AREA: Area details (VARCHAR)
   - TERRITORY: Territory (VARCHAR) - e.g., "PRO-KHI"
   - TOWN: Town (VARCHAR) - e.g., "Karachi"
   - TOWN_TYPE: Type of town (VARCHAR)
   - ADDRESS: Location address
   - PLANT: Plant location (VARCHAR) - e.g., "LAHORE WAREHOUSE"
   - REGISTRATION_DATE: Registration date (DATE)

=== PRODUCT DATA ===
3. DIMPRODUCT (Product Master Data)
   - PRODUCTKEY (PK): Product key (INT)
   - PRODUCTCODE: Product code (VARCHAR)
   - PRODUCTDESCRIPTION: Description (VARCHAR) - e.g., "Flour", "Yeast (1 X 20 Pkts)"
   - PRODUCTCATEGORY: Category (VARCHAR) - e.g., "Yeast", "Flour"
   - PRODUCTBRAND: Brand (VARCHAR)
   - PRODUCTSUBBRAND: Sub-brand (VARCHAR)
   - PRODUCTBU: Business unit (VARCHAR)
   - PRODUCTSTATUS: Product status
   - PRODUCTFORMAT: Format (VARCHAR)
   - PRODUCTPACKING: Packing (INT)
   - PRODUCTTYPE: Product type (VARCHAR) - e.g., "Local"

=== SALES DATA ===
4. FACT_SALES_ORDER (Primary Sales - Orders to Distributors)
   - DATEKEY: Date of sales (INT, format: YYYYMMDD) - e.g., 20240220 = February 20, 2024
   - DISTKEY (FK): Links to DIMDISTRIBUTION_MASTER.DISTKEY
   - DIST_LOCKEY (FK): Links to DIMDISTRIBUTION_LOCATION.DIST_LOCKEY
   - PRODUCTKEY (FK): Links to DIMPRODUCT.PRODUCTKEY
   - UOM: Unit of measure (VARCHAR) - e.g., "Carton"
   - UNITS: Units sold (INT)
   - QUANTITY: Quantity sold in cartons (INT)
   - NET_AMOUNT: Net sales amount (DECIMAL) - Use this for primary sales analysis
   - GROSS_AMOUNT: Gross sales amount (DECIMAL)
   - EXFACT_AMOUNT: Ex-factory amount (DECIMAL)
   - CATEGORYTYPE: Category (VARCHAR) - e.g., "TAN"
   - ORDERTYPE: Order type (VARCHAR) - e.g., "LOCAL SALE"
   - INQUIRYNO: Inquiry number (VARCHAR)
   - WAREHOUSEKEY: Warehouse key (INT)
   - COMPANYKEY: Company key (INT)

5. FACT_SECONDARY_SALES (Secondary Sales - Market Sales)
   - DATEKEY: Date of sales (INT, format: YYYYMMDD) - e.g., 20221201 = December 1, 2022
   - DOCDATEKEY: Document date key (INT)
   - PRODUCTKEY (FK): Links to DIMPRODUCT.PRODUCTKEY
   - DISTKEY (FK): Links to DIMDISTRIBUTION_MASTER.DISTKEY
   - CARTONS: Cartons sold (INT)
   - UNITS: Units sold (INT)
   - NET_AMOUNT: Net sales amount (DECIMAL) - Use this for secondary sales analysis
   - GROSS_AMOUNT: Gross sales amount (DECIMAL)
   - EXFACT: Ex-factory price (DECIMAL)
   - FLAG: Sales flag (VARCHAR) - e.g., "P"
   - INVOICENO: Invoice number (VARCHAR)
   - SHOPCODE: Shop code (INT)
   - SECTIONKEY: Section key (INT)

=== KEY RELATIONSHIPS ===
- DIMDISTRIBUTION_MASTER.DISTKEY -> FACT_SALES_ORDER.DISTKEY
- DIMDISTRIBUTION_MASTER.DISTKEY -> FACT_SECONDARY_SALES.DISTKEY
- DIMDISTRIBUTION_LOCATION.DISTKEY -> DIMDISTRIBUTION_MASTER.DISTKEY
- DIMDISTRIBUTION_LOCATION.DIST_LOCKEY -> FACT_SALES_ORDER.DIST_LOCKEY
- DIMPRODUCT.PRODUCTKEY -> FACT_SALES_ORDER.PRODUCTKEY
- DIMPRODUCT.PRODUCTKEY -> FACT_SECONDARY_SALES.PRODUCTKEY

=== DATE HANDLING - CRITICAL ===
DATEKEY is stored as INTEGER in YYYYMMDD format:
- 20220101 = January 1, 2022
- 20221231 = December 31, 2022
- 20240101 = January 1, 2024
- 20241231 = December 31, 2024

To extract year: CAST(DATEKEY/10000 AS INT) or DATEKEY/10000
To extract month: CAST((DATEKEY % 10000)/100 AS INT) or (DATEKEY % 10000)/100
To extract day: DATEKEY % 100

Date range filters:
- Year 2022: DATEKEY >= 20220101 AND DATEKEY <= 20221231
- Year 2023: DATEKEY >= 20230101 AND DATEKEY <= 20231231
- Year 2024: DATEKEY >= 20240101 AND DATEKEY <= 20241231
- January 2024: DATEKEY >= 20240101 AND DATEKEY <= 20240131
- Last 3 years (2022-2024): DATEKEY >= 20220101 AND DATEKEY <= 20241231

For month-wise grouping, use: CAST((DATEKEY % 10000)/100 AS INT) AS Month, CAST(DATEKEY/10000 AS INT) AS Year
For year-wise grouping, use: CAST(DATEKEY/10000 AS INT) AS Year

=== IMPORTANT NOTES ===
- Always use NET_AMOUNT for sales calculations (primary or secondary)
- Use proper JOINs to get readable names instead of IDs
- Use INNER JOIN for fact tables
- For aggregations, always GROUP BY the non-aggregated columns
- Use SUM() for totals, AVG() for averages, COUNT() for counts
- For time-series, extract year/month from DATEKEY and group by them
`;

export function getSchemaDescription() {
  return schemaDescription;
}
