from datetime import datetime, timedelta
import mysql.connector
from flask_cors import CORS
from flask import Flask, request, jsonify

app = Flask(__name__)
CORS(app)

db = mysql.connector.connect(
    host="localhost",
    user="root",
    password="xiaowuxiaowu66",
    database="fastfood"
)


@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    customer_name = data['customerName']
    sex = data['sex']
    phonenumber = data['phonenumber']
    address = data['address']
    member = data['member']
    password = data['password']

    cursor = db.cursor()

    cursor.execute("SELECT CustomerID FROM customer ORDER BY CustomerID DESC LIMIT 1")
    result = cursor.fetchone()

    if result is None:
        customerID = 1
    else:
        customerID = result[0] + 1

    sql = "INSERT INTO customer (CustomerID, customerName, sex, phonenumber, address, member, password) VALUES (%s, %s, %s, %s, %s, %s, %s)"
    val = (customerID, customer_name, sex, phonenumber, address, member, password)

    try:
        cursor.execute(sql, val)
        db.commit()
        return jsonify({'message': 'Success!'})
    except mysql.connector.errors.IntegrityError:
        return jsonify({'message': 'Duplicate entry'}), 409


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    phone_number = data['phonenumber']
    password = data['password']

    cursor = db.cursor()

    # 查询数据库中的用户
    sql = "SELECT CustomerID, password FROM customer WHERE phonenumber = %s"
    val = (phone_number,)

    cursor.execute(sql, val)
    result = cursor.fetchone()

    if result is None:
        return jsonify({'message': 'User does not exist, please register first.'}), 404
    elif result[1] != password:
        print(result[1])
        return jsonify({'message': 'Password is incorrect.'}), 401
    else:
        sql = "SELECT COUNT(*) FROM currentid"
        cursor.execute(sql)
        count = cursor.fetchone()[0]

        if count == 0:
            sql = "INSERT INTO currentid (ID) VALUES (%s)"
        else:
            sql = "UPDATE currentid SET ID = %s"

        val = (result[0],)
        cursor.execute(sql, val)
        db.commit()

        return jsonify({'message': 'Login successful!'})


@app.route('/get_current_user_id', methods=['GET'])
def get_current_user_id():
    cursor = db.cursor()

    # 查询currentid表中的ID
    sql = "SELECT ID FROM currentid"
    cursor.execute(sql)
    result = cursor.fetchone()

    if result is None:
        return jsonify({'message': 'No current user.'}), 404
    else:
        return jsonify({'current_user_id': result[0]})


@app.route('/getDishes/<int:type>', methods=['GET'])
def getDishes(type):
    cursor = db.cursor()

    if type:
        sql = "SELECT * FROM menu WHERE type = %s"
        val = (type,)
        cursor.execute(sql, val)
    else:
        sql = "SELECT * FROM menu"
        cursor.execute(sql)

    result = cursor.fetchall()

    if len(result) == 0:
        return jsonify({'message': 'No dishes found for this type.'}), 404

    dishes = []
    for row in result:
        dish = {
            'DishID': row[0],
            'DishName': row[1],
            'Price': row[2],
            'MemberPrice': row[3],
            'Type': row[4]
        }
        dishes.append(dish)

    return jsonify(dishes)


@app.route('/createOrder', methods=['POST'])
def createOrder():
    data = request.get_json()

    userID = data['userID']
    selectedDishes = data['selectedDishes']
    currentTime = datetime.now()
    cursor = db.cursor()

    cursor.execute("SELECT OrderID FROM orderr ORDER BY OrderID DESC LIMIT 1")
    result = cursor.fetchone()

    if result is None:
        OrderID = 1
    else:
        OrderID = result[0] + 1

    cursor.execute("SELECT MemStart, MemEnd FROM mem WHERE CustomerID = %s", (userID,))
    result = cursor.fetchone()

    currentDate = datetime.now().date()
    if result is None:
        member = 0
    else:
        memStart, memEnd = result
        member = 1 if memStart <= currentDate <= memEnd else 0

    sql = "INSERT INTO orderr (OrderID, CustomerID, OrderTime, member) VALUES (%s, %s, %s, %s)"
    val = (OrderID, userID, currentTime, member)

    try:
        cursor.execute(sql, val)
        db.commit()

        for dishName, quantity in selectedDishes.items():
            cursor.execute("SELECT DishID FROM menu WHERE DishName = %s", (dishName,))
            dishID = cursor.fetchone()[0]

            cursor.execute("SELECT OrderItemsID FROM order_items ORDER BY OrderItemsID DESC LIMIT 1")
            result = cursor.fetchone()
            if result is None:
                OrderItemsID = 1
            else:
                OrderItemsID = result[0] + 1

            sql = "INSERT INTO order_items (OrderItemsID, OrderID, DishID, Quantity) VALUES (%s, %s, %s, %s)"
            val = (OrderItemsID, OrderID, dishID, quantity)
            cursor.execute(sql, val)
            db.commit()

        return jsonify({'message': 'Success!'})
    except mysql.connector.errors.IntegrityError:
        return jsonify({'message': 'Duplicate entry'}), 409


@app.route('/getOrders/<int:id>', methods=['GET'])
def getOrders(id):
    cursor = db.cursor()

    cursor.execute("SELECT customerName, sex FROM customer WHERE CustomerID = %s", (id,))
    result = cursor.fetchone()

    if result is None:
        return jsonify({'message': 'User does not exist.'}), 404
    customerName, sex = result

    cursor.execute("SELECT OrderID, OrderTime, member FROM orderr WHERE CustomerID = %s", (id,))
    orders = cursor.fetchall()

    all_orders = []
    for order in orders:
        OrderID, OrderTime, member = order

        cursor.execute("SELECT DishID, Quantity FROM order_items WHERE OrderID = %s", (OrderID,))
        items = cursor.fetchall()

        order_items = []
        for item in items:
            DishID, Quantity = item

            if member:
                cursor.execute("SELECT DishName, MemberPrice FROM menu WHERE DishID = %s", (DishID,))
            else:
                cursor.execute("SELECT DishName, Price FROM menu WHERE DishID = %s", (DishID,))
            result = cursor.fetchone()
            DishName, Price = result

            order_items.append({
                'DishName': DishName,
                'Price': float(Price),
                'Quantity': Quantity
            })

        all_orders.append({
            'customerName': customerName,
            'OrderTime': str(OrderTime),
            'OrderItems': order_items,
            'sex': sex,
            'member': member,
        })

    if len(all_orders) == 0:
        return jsonify({'customerName': customerName, 'sex': sex}), 200

    return jsonify(all_orders)


@app.route('/purchaseMembership/<string:duration>', methods=['POST'])
def purchaseMembership(duration):
    data = request.get_json()
    CustomerID = data['CustomerID']
    cursor = db.cursor()
    currentTime = datetime.now().date()
    cursor.execute("SELECT memID, MemStart, MemEnd FROM mem WHERE CustomerID = %s", (CustomerID,))
    result = cursor.fetchone()

    if result is None:
        cursor.execute("SELECT MAX(memID) FROM mem")
        max_memID = cursor.fetchone()[0]
        memID = max_memID + 1 if max_memID is not None else 1
        oldMemStart = currentTime
        oldMemEnd = currentTime
    else:
        memID = result[0]
        oldMemStart = result[1]
        oldMemEnd = result[2]

    if duration == 'month':
        calculatedTime = timedelta(days=31)
    elif duration == 'quarter':
        calculatedTime = timedelta(days=31 * 4)
    elif duration == 'year':
        calculatedTime = timedelta(days=365)
    else:
        return jsonify({'message': 'Invalid duration.'}), 400

    if currentTime > oldMemEnd:
        MemStart = currentTime
        MemEnd = currentTime + calculatedTime
    else:
        MemStart = oldMemStart
        MemEnd = oldMemEnd + calculatedTime

    if result is None:
        sql = "INSERT INTO mem (memID, CustomerID, MemStart, MemEnd) VALUES (%s, %s, %s, %s)"
        val = (memID, CustomerID, MemStart, MemEnd)
        cursor.execute(sql, val)
        db.commit()
    else:
        sql = "UPDATE mem SET MemStart = %s, MemEnd = %s WHERE memID = %s"
        val = (MemStart, MemEnd, memID)
        cursor.execute(sql, val)
        db.commit()

    sql = "UPDATE customer SET member = 1 WHERE CustomerID = %s"
    val = (CustomerID,)
    cursor.execute(sql, val)

    db.commit()

    return jsonify({'message': 'Membership purchased successfully.'}), 200


if __name__ == '__main__':
    app.run(port=5000)
