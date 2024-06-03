from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)


@app.route('/get_menu', methods=['GET'])
def get_menu():
    # 连接到MySQL数据库
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="xiaowuxiaowu66",
        database="fast_food"
    )

    cursor = db.cursor()

    # 查询所有菜单项
    sql = "SELECT * FROM Menu"
    cursor.execute(sql)

    menu = cursor.fetchall()

    return jsonify(menu)


@app.route('/search_menu', methods=['POST'])
def search_menu():
    data = request.get_json()

    dish_name = data['DishName']

    # 连接到MySQL数据库
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="xiaowuxiaowu66",
        database="fast_food"
    )

    cursor = db.cursor()

    # 根据菜名搜索菜单项
    sql = "SELECT * FROM Menu WHERE DishName LIKE %s"
    val = ("%" + dish_name + "%",)
    cursor.execute(sql, val)

    menu = cursor.fetchall()

    return jsonify(menu)


@app.route('/add_dish', methods=['POST'])
def add_dish():
    data = request.get_json()

    dish_name = data['DishName']
    price = data['Price']
    member_price = data['MemberPrice']

    # 连接到MySQL数据库
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="xiaowuxiaowu66",
        database="fast_food"
    )

    cursor = db.cursor()

    # 插入数据
    sql = "INSERT INTO Menu (DishName, Price, MemberPrice) VALUES (%s, %s, %s)"
    val = (dish_name, price, member_price)
    try:
        cursor.execute(sql, val)
        db.commit()
        return jsonify({'message': 'Success!'})
    except mysql.connector.errors.IntegrityError:
        return jsonify({'message': 'Duplicate entry'}), 409


@app.route('/delete_dish', methods=['POST'])
def delete_dish():
    data = request.get_json()

    dish_id = data['DishID']

    # 连接到MySQL数据库
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="xiaowuxiaowu66",
        database="fast_food"
    )

    cursor = db.cursor()

    # 删除菜单项
    sql = "DELETE FROM Menu WHERE DishID = %s"
    val = (dish_id,)
    cursor.execute(sql, val)

    db.commit()

    return jsonify({'message': 'Success!'})


@app.route('/update_dish', methods=['POST'])
def update_dish():
    data = request.get_json()

    dish_id = data['DishID']
    dish_name = data['DishName']
    price = data['Price']
    member_price = data['MemberPrice']

    # 连接到MySQL数据库
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="xiaowuxiaowu66",
        database="fast_food"
    )

    cursor = db.cursor()

    # 更新菜单项
    sql = "UPDATE Menu SET DishName = %s, Price = %s, MemberPrice = %s WHERE DishID = %s"
    val = (dish_name, price, member_price, dish_id)
    cursor.execute(sql, val)

    db.commit()

    return jsonify({'message': 'Success!'})


if __name__ == '__main__':
    app.run(port=5000)
