from flask import Flask, render_template


app = Flask(__name__, static_url_path='/static')


@app.route("/", methods=['GET'], endpoint="route_index")
def route_index():
    return render_template("index.html")


@app.route("/<path:path>", methods=['GET'], endpoint="route_static")
def route_static(path):
    return app.send_static_file(path)


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=80
    )
