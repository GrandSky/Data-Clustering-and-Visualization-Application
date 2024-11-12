from flask import Flask, render_template, jsonify, request
import pandas as pd
import numpy as np
import matplotlib.colors as mcolors
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.metrics.pairwise import euclidean_distances
from sklearn.manifold import MDS
from sklearn.cluster import KMeans
import matplotlib.pyplot as plt
from sklearn.metrics import silhouette_score


app = Flask(__name__)
app.static_folder = 'static'
data = pd.read_csv("student-mat.csv")

@app.route('/')
def index():
    numeric = data.select_dtypes(include='int64')
    categorical = data.select_dtypes(exclude='number')
    categorical_data_json = categorical.to_json(orient='records')
    numeric_data_json = numeric.to_json(orient='records')

    return render_template('index.html', numeric_data_json=numeric_data_json, categorical_data_json=categorical_data_json)

@app.route('/kmeans')
def kmeans():
    numeric = data.select_dtypes(include='int64')
    pca=PCA(n_components=2)
    scaler = StandardScaler()
    standardized_data = scaler.fit_transform(numeric)
    reduced_data = pca.fit_transform(standardized_data)
    
    # Implementing the Elbow Method to find the optimal number of clusters
    distortions = []
    K = range(1, 11)  # Test clusters from 1 to 10
    for k in K:
        kmeans = KMeans(n_clusters=k)
        kmeans.fit(reduced_data)
        distortions.append(kmeans.inertia_)

    silhouette_scores = []
    for k in range(2, 11):  # Test clusters from 2 to 10
        kmeans = KMeans(n_clusters=k)
        kmeans.fit(reduced_data)
        labels = kmeans.labels_
        score = silhouette_score(reduced_data, labels)
        silhouette_scores.append(score)

    # Find the optimal number of clusters based on the silhouette scores
    optimal_k = silhouette_scores.index(max(silhouette_scores)) + 2  # Adding 2 because we started from 2 clusters

    kmeans = KMeans(n_clusters=optimal_k)
    
    kmeans.fit(reduced_data)
    cluster_labels = kmeans.labels_
    colors = plt.cm.tab10(np.linspace(0, 1, optimal_k))
    hex_colors = [mcolors.to_hex(c) for c in colors]  # Convert colors to hexadecimal
    kmeans_results = {
        'cluster_labels': cluster_labels.tolist(),  # Convert to list for JSON serialization
        'coordinates': reduced_data.tolist(),  # Pass the coordinates to the frontend
        'cluster_colors': hex_colors
    }

    return render_template('kmeans.html', kmeans_results=kmeans_results)

@app.route('/bar-chart-data/<selected_variable_x>')
def bar_chart_data(selected_variable_x):
    bar_chart_counts = data[selected_variable_x].value_counts().reset_index().rename(columns={selected_variable_x: 'category', 'index': selected_variable_x})
    bar_chart_data = bar_chart_counts.to_dict(orient='records')
    return jsonify(bar_chart_data)

@app.route('/histogram-data/<selected_variable_x>')
def histogram_data(selected_variable_x):
    # Calculate histogram counts
    counts, edges = np.histogram(data[selected_variable_x], bins=10)
    histogram_data = [{'bin_start': edges[i], 'bin_end': edges[i + 1], 'count': int(counts[i])} for i in range(len(counts))]
    x_domain = edges.tolist()
    return jsonify({'histogram_data': histogram_data, 'x_domain': x_domain})

def find_continuous_color(variable, value):
    color_dict = selected_colors.get(variable, {})
    
    if isinstance(value, np.ndarray):
        value = value[0] if len(value) > 0 else None  # Consider the first element if it's an array

    for key, color in color_dict.items():
        if isinstance(key, tuple) and len(key) == 2 and key[0] <= value <= key[1]:
            return color

    return "steelblue"

def find_categorical_color(variable, value):
    color_dict = selected_colors.get(variable, {})

    if isinstance(value, np.ndarray):
        value = value[0] if len(value) > 0 else None  # Consider the first element if it's an array

    for key, color in color_dict.items():
        if key == value:
            return color

    return "steelblue"

@app.route('/biplot-data/<selected_variable>')
def biplot_data(selected_variable):
    global selected_colors 
    numeric_variables = ["Walc", "Dalc", "age", "Medu", "Fedu", "traveltime", "studytime", "failures", "famrel", "freetime", "goout",
                         "health", "absences", "G1", "G2", "G3"]

    biplot_data = data[numeric_variables]

    pca = PCA(n_components=10)
    scaler = StandardScaler()
    standardized_data = scaler.fit_transform(biplot_data)

    reduced_data = pca.fit_transform(standardized_data)
    

    loading_factors = pca.components_

    data['PCA1'] = reduced_data[:, 0]
    data['PCA2'] = reduced_data[:, 1]

    selected_range = request.args.get('selected_range')
    selected_color = request.args.get('selected_color')
    if ',' in selected_range:
        if selected_range is not None and selected_color is not None:
            selected_range = list(map(float, selected_range.split(',')))
            selected_colors[selected_variable] = selected_colors.get(selected_variable, {})
            selected_colors[selected_variable][tuple(selected_range)] = selected_color
            color_function = np.vectorize(lambda x: find_continuous_color(selected_variable, x))
            data['color'] = color_function(data[selected_variable])
    elif len(selected_range) > 0: 
        print("CATEGORIES")
        if selected_range is not None and selected_color is not None:
            print("CATEGORIES")
            # Logic to handle categorical selections
            selected_colors[selected_variable] = selected_colors.get(selected_variable, {})
            selected_colors[selected_variable][selected_range] = selected_color
            color_function = np.vectorize(lambda x: find_categorical_color(selected_variable, x))
            data['color'] = color_function(data[selected_variable])
    else:
        print("RESTART")
        selected_colors = {}
        data['color'] = 'steelblue'
    
    explained_variance = pca.explained_variance_ratio_
    explained_variance = explained_variance.tolist()
    loading_factor_names =  biplot_data.columns.tolist()
    
    response_data = {
        'records': data.to_dict(orient='records'),
        'loading_factor_names': loading_factor_names,
        'loading_factors': loading_factors.tolist() # Convert numpy array to a nested list for JSON serialization
    }

    return jsonify(response_data)

@app.route('/mds-data/<selected_variable>')
def mds_data(selected_variable):
    global selected_colors
    numeric_columns = data.select_dtypes(include='int64')
    distances = euclidean_distances(numeric_columns)
    mds=MDS(n_components=2,dissimilarity='precomputed',random_state=42)
    mds_corr = mds.fit_transform(distances).tolist()
    colors = []

    selected_range = request.args.get('selected_range')
    selected_color = request.args.get('selected_color')
    if ',' in selected_range:
        if selected_range is not None and selected_color is not None:
            selected_range = list(map(float, selected_range.split(',')))
            selected_colors[selected_variable] = selected_colors.get(selected_variable, {})
            selected_colors[selected_variable][tuple(selected_range)] = selected_color
            color_function = np.vectorize(lambda x: find_continuous_color(selected_variable, x))
            colors = color_function(data[selected_variable])
    elif len(selected_range) > 0: 
        print("CATEGORIES")
        if selected_range is not None and selected_color is not None:
            print("CATEGORIES")
            # Logic to handle categorical selections
            selected_colors[selected_variable] = selected_colors.get(selected_variable, {})
            selected_colors[selected_variable][selected_range] = selected_color
            color_function = np.vectorize(lambda x: find_categorical_color(selected_variable, x))
            colors = color_function(data[selected_variable])
    else:
        print("RESTART")
        selected_colors = {}
    
    if len(colors) > 0:  # Check if there are elements in colors
        colors = colors.tolist()
    
    response_data = {
        'mds_data': mds_corr,
        'colors' : colors
    }

    return jsonify(response_data)

@app.route('/parallel-data/<selected_variable>')
def parallel_data(selected_variable):
    global selected_colors
    numeric_columns = data.select_dtypes(include='int64')
    correlation = numeric_columns.corr()
    
    sum_absolute_correlations = correlation.abs().sum()
    
    # Select the top 8 attributes with the highest sums
    selected_attributes = []
    for i in range(8):
        if i == 0:
            selected_attr = sum_absolute_correlations.idxmax()
        else:
            selected_attr = correlation[selected_attributes[i - 1]].drop(selected_attributes[:i]).abs().idxmax()
        selected_attributes.append(selected_attr)

    selected_data = data[selected_attributes]
    
    # Add color information similar to what's done in biplots
    selected_range = request.args.get('selected_range')
    selected_color = request.args.get('selected_color')
    if ',' in selected_range:
        if selected_range is not None and selected_color is not None:
            selected_range = list(map(float, selected_range.split(',')))
            selected_colors[selected_variable] = selected_colors.get(selected_variable, {})
            selected_colors[selected_variable][tuple(selected_range)] = selected_color
            color_function = np.vectorize(lambda x: find_continuous_color(selected_variable, x))
            selected_data['color'] = color_function(data[selected_variable])
    elif len(selected_range) > 0: 
        print("CATEGORIES")
        if selected_range is not None and selected_color is not None:
            print("CATEGORIES")
            # Logic to handle categorical selections
            selected_colors[selected_variable] = selected_colors.get(selected_variable, {})
            selected_colors[selected_variable][selected_range] = selected_color
            color_function = np.vectorize(lambda x: find_categorical_color(selected_variable, x))
            selected_data['color'] = color_function(data[selected_variable])
    else:
        print("RESTART")
        selected_colors = {}
        selected_data['color'] = 'steelblue'
    
    return jsonify({
        'selected_attributes': selected_attributes,
        'selected_data': selected_data.to_dict(orient='records')
    })


if __name__ == '__main__':
    app.debug = True
    app.run()
