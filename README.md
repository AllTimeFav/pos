Point of Sale (POS) System

Overview

The Point of Sale (POS) System is a web-based application designed to streamline sales, inventory management, and user access control for retail stores. The system provides role-based authentication for admins, store managers, and cashiers, ensuring secure and efficient transactions.

Features

1. User Management

    Admin can create, edit, and delete users.

    Role-based access control: Admin, Store Manager, and Cashier.

    Store Managers can reset their passwords upon admin approval.

2. Product Management

    Add, edit, and delete products (Admin only).

    Track inventory levels and prevent sales of out-of-stock items.

    Generate product reports.

3. Sales & Transactions

    Cashiers can process sales and generate invoices.

    Automated stock deduction after a sale.

    Sales reports with filters by date, product, and store.

4. Inventory Management

    Track stock levels in real-time.

    Low-stock alerts for store managers.

    Admin can adjust stock manually if needed.

5. Authentication & Security

    Secure login with password encryption.

    Persistent authentication using cookies.

    Forgot Password: Store managers request resets, and admins approve them.

Technologies Used

    Frontend: Remix, React, Tailwind CSS

    Backend: Remix (Server-side), Prisma ORM, Node.js

    Database: PostgreSQL

    Authentication: JWT & Cookies

    UI Components: Lucide Icons, React Icons

For demonstration purposes use the following credentials
    email : abd@gmmail.com
    pass  : 12345678

Admin Functionalities

    Approve or reject store manager password reset requests.

    Manage users, products, and inventory.

    View system-wide reports.

    Store Manager Functionalities

    Request password reset from the admin.

    Manage store-specific inventory.

    View sales and inventory reports.

Store Manager Functionalities
    Manage products and inventory
    Manage Cashiers
    Apperove Cashiers reset password requests
    View sales
    View system-wide report

Cashier Functionalities

    Process sales and generate invoices.

    View their own sales history.

Contribution

Contributions are welcome! Please follow the guidelines:

Fork the repository.

Create a new branch: git checkout -b feature-name

Commit changes: git commit -m 'Add feature X'

Push to branch: git push origin feature-name

Open a Pull Request.

License

This project is licensed under the MIT License.

Contact

For support, contact:

Email: anxjs273@gmail.com

WhatsApp: +92 310 4907349

