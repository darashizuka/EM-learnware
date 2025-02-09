import magpylib as magpy
import pyvista as pv
import numpy as np
import json

def compute_streamlines(c_res):
    # Create a magnet with Magpylib
    magnet = magpy.magnet.Cylinder(polarization=(0, 0, 1), dimension=(0.010, 0.004))

    # Create a 3D grid with Pyvista
    grid = pv.ImageData(
        dimensions=(41, 41, 41),
        spacing=(0.001, 0.001, 0.001),
        origin=(-0.02, -0.02, -0.02),
    )

    # Compute B-field and add as data to grid
    grid["B"] = magnet.getB(grid.points) * 1000  # T -> mT

    # Compute the field lines
    seed = pv.Disc(inner=0.002, outer=0.0028, r_res=1, c_res=c_res)
    strl = grid.streamlines_from_source(
        seed,
        vectors="B",
        max_step_length=0.1,
        max_time=0.02,
        integration_direction="both",
    )

    # Extract streamline points
    streamline_points = []
    for i in range(strl.n_cells):
        cell = strl.get_cell(i)
        points = cell.points
        streamline_points.append(points.tolist())

    return streamline_points

# Generate and save streamline points for different c_res values
c_res_values = [5, 10, 15, 20, 25]
for c_res in c_res_values:
    streamline_points = compute_streamlines(c_res)
    filename = f'streamline_points_{c_res}.json'
    with open(filename, 'w') as f:
        json.dump(streamline_points, f)
    print(f'Saved streamline points to {filename}')
