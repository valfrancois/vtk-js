import 'vtk.js/Sources';

const vtkFile = `
# vtk DataFile Version 2.0
geometry
ASCII
DATASET POLYDATA
POINTS 60 float
20 0 0
19.94 0.5197 0
19.78 1.0168 0
19.52 1.4694 0
19.17 1.8578 0
18.75 2.1650 0
18.27 2.37 0
17.76 2.48 0
17.23 2.48 0
16.72 2.37 0
16.25 2.16 0
15.82 1.85 0
15.47 1.46 0
15.21 1.016 0
15.05 0.5197 0
15 0 0
15.05 -0.51 0
15.21 -1.01 0
15.47 -1.46 0
15.82 -1.85 0
16.25 -2.16 0
16.72 -2.37 0
17.23 -2.48 0
17.76 -2.48 0
18.27 -2.37 0
18.75 -2.16 0
19.17 -1.85 0
19.52 -1.46 0
19.78 -1.01 0
19.94 -0.51 0
19 0 0
18.96 0.311 0
18.87 0.610 0
18.71 0.881 0
18.50 1.114 0
18.25 1.299 0
17.96 1.426 0
17.65 1.491 0
17.34 1.491 0
17.03 1.426 0
16.75 1.299 0
16.49 1.114 0
16.28 0.881 0
16.12 0.610 0
16.03 0.311 0
16 0 0
16.03 -0.311 0
16.12 -0.610 0
16.28 -0.881 0
16.49 -1.114 0
16.75 -1.299 0
17.03 -1.426 0
17.34 -1.491 0
17.65 -1.491 0
17.96 -1.426 0
18.25 -1.299 0
18.50 -1.114 0
18.71 -0.881 0
18.87 -0.610 0
18.96 -0.311 0

POLYGONS 30 150
4 0 30 31 1
4 1 31 32 2
4 2 32 33 3
4 3 33 34 4
4 4 34 35 5
4 5 35 36 6
4 6 36 37 7
4 7 37 38 8
4 8 38 39 9
4 9 39 40 10
4 10 40 41 11
4 11 41 42 12
4 12 42 43 13
4 13 43 44 14
4 14 44 45 15
4 15 45 46 16
4 16 46 47 17
4 17 47 48 18
4 18 48 49 19
4 19 49 50 20
4 20 50 51 21
4 21 51 52 22
4 22 52 53 23
4 23 53 54 24
4 24 54 55 25
4 25 55 56 26
4 26 56 57 27
4 27 57 58 28
4 28 58 59 29
4 29 59 30 0

CELL_DATA 30
SCALARS rgbaData float 4
LOOKUP_TABLE default
1.0 0 0 0.2
1.0 0 0 0.3
1.0 0 0 0.4
1.0 0 0 0.5
1.0 0 0 0.6
1.0 0 0 0.7
1.0 0 0 0.8
1.0 0 0 0.9
1.0 0 0 0.1
1.0 0 0 0.2
0 1.0 0 0.3
0 1.0 0 0.4
0 1.0 0 0.5
0 1.0 0 0.6
0 1.0 0 0.7
0 1.0 0 0.8
0 1.0 0 0.9
0 1.0 0 0.2
0 1.0 0 0.2
0 1.0 0 0.2
0 0 1.0 0.2
0 0 1.0 0.2
0 0 1.0 0.2
0 0 1.0 0.2
0 0 1.0 0.2
0 0 1.0 0.2
0 0 1.0 0.2
0 0 1.0 0.2
0 0 1.0 0.2
0 0 1.0 0.2

CELL_DATA 30
SCALARS rgbData float 3
LOOKUP_TABLE default
1.0 0 0
1.0 0 0
1.0 0 0
1.0 0 0
1.0 0 0
1.0 0 0
1.0 0 0
1.0 0 0
1.0 0 0
1.0 0 0
0 1.0 0
0 1.0 0
0 1.0 0
0 1.0 0
0 1.0 0
0 1.0 0
0 1.0 0
0 1.0 0
0 1.0 0
0 1.0 0
0 0 1.0
0 0 1.0
0 0 1.0
0 0 1.0
0 0 1.0
0 0 1.0
0 0 1.0
0 0 1.0
0 0 1.0
0 0 1.0
`;

const vtk = window.vtk;

// Init
const mapper = vtk.Rendering.Core.vtkMapper.newInstance();
const actor = vtk.Rendering.Core.vtkActor.newInstance();
const polyDataReader = vtk.IO.Legacy.vtkPolyDataReader.newInstance();

// create what we will view
const renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
const renderer = vtk.Rendering.Core.vtkRenderer.newInstance();
renderWindow.addRenderer(renderer);
renderer.setBackground(0.2, 0.2, 0.2);

// Create some control UI
const container = document.querySelector('body');
const renderWindowContainer = document.createElement('div');
container.appendChild(renderWindowContainer);

// now create something to view it, in this case webgl
const glwindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
glwindow.setContainer(renderWindowContainer);
renderWindow.addView(glwindow);
glwindow.setSize(400, 400);

// Read data. Originally: polyDataReader.setUrl(someUrl);
polyDataReader.parseAsText(vtkFile);

// Configure Mapper
mapper.setInputData(polyDataReader.getOutputData(0));
mapper.setColorModeToDirectScalars();
mapper.setScalarModeToUseCellFieldData();

// Set cell data array by name.
// DOES NOT WORK IF SET TO 'rgbaData'
mapper.setColorByArrayName('rgbaData');

actor.setMapper(mapper);
renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// Interactor
const interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
interactor.setStillUpdateRate(0.01);
interactor.setView(glwindow);
interactor.initialize();
interactor.bindEvents(renderWindowContainer);
interactor.setInteractorStyle(
  vtk.Interaction.Style.vtkInteractorStyleTrackballCamera.newInstance()
);
